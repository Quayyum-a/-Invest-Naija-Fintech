"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMonitoring = exports.performanceMonitor = exports.errorTracker = exports.memoryMonitor = exports.livenessCheck = exports.readinessCheck = exports.resetMetrics = exports.getMetrics = exports.healthCheck = exports.requestMetrics = void 0;
const env_1 = require("../config/env");
// Global metrics storage
const metrics = {
    requests: 0,
    errors: 0,
    responseTime: {
        avg: 0,
        min: Infinity,
        max: 0,
    },
    endpoints: new Map(),
};
// Request timing and metrics middleware
const requestMetrics = (req, res, next) => {
    var _a;
    const startTime = Date.now();
    // Increment request counter
    metrics.requests++;
    // Track endpoint metrics
    const endpoint = `${req.method} ${((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.path}`;
    const endpointMetrics = metrics.endpoints.get(endpoint) || {
        count: 0,
        avgTime: 0,
        errors: 0,
    };
    endpointMetrics.count++;
    metrics.endpoints.set(endpoint, endpointMetrics);
    // Monitor response
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        // Update response time metrics
        metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);
        metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
        metrics.responseTime.avg =
            (metrics.responseTime.avg * (metrics.requests - 1) + duration) /
                metrics.requests;
        // Update endpoint metrics
        endpointMetrics.avgTime =
            (endpointMetrics.avgTime * (endpointMetrics.count - 1) + duration) /
                endpointMetrics.count;
        // Track errors
        if (res.statusCode >= 400) {
            metrics.errors++;
            endpointMetrics.errors++;
        }
        // Log slow requests
        if (duration > 5000) {
            console.warn(`SLOW REQUEST: ${endpoint} took ${duration}ms`);
        }
        // Log error responses
        if (res.statusCode >= 500) {
            console.error(`SERVER ERROR: ${endpoint} returned ${res.statusCode} in ${duration}ms`);
        }
    });
    next();
};
exports.requestMetrics = requestMetrics;
// Health check endpoint
const healthCheck = (req, res) => {
    try {
        const health = {
            uptime: process.uptime(),
            timestamp: Date.now(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || "unknown",
            environment: env_1.env.NODE_ENV,
            database: "connected", // Would check actual DB connection in production
            services: {
                paystack: !!env_1.env.PAYSTACK_SECRET_KEY,
                smtp: !!env_1.env.SENDGRID_API_KEY,
                sms: !!env_1.env.TERMII_API_KEY,
            },
        };
        // Check if system is healthy
        const memoryUsage = process.memoryUsage();
        const memoryLimit = 512 * 1024 * 1024; // 512MB limit
        const isHealthy = memoryUsage.heapUsed < memoryLimit && process.uptime() > 0;
        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? "healthy" : "unhealthy",
            data: health,
        });
    }
    catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json({
            status: "unhealthy",
            error: "Health check failed",
        });
    }
};
exports.healthCheck = healthCheck;
// Metrics endpoint
const getMetrics = (req, res) => {
    try {
        const endpointMetrics = Array.from(metrics.endpoints.entries()).map(([endpoint, data]) => (Object.assign({ endpoint }, data)));
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, metrics), { endpoints: endpointMetrics, uptime: process.uptime(), memory: process.memoryUsage() }),
        });
    }
    catch (error) {
        console.error("Metrics collection failed:", error);
        res.status(500).json({
            success: false,
            error: "Failed to collect metrics",
        });
    }
};
exports.getMetrics = getMetrics;
// Reset metrics (for testing/debugging)
const resetMetrics = (req, res) => {
    metrics.requests = 0;
    metrics.errors = 0;
    metrics.responseTime = {
        avg: 0,
        min: Infinity,
        max: 0,
    };
    metrics.endpoints.clear();
    res.json({
        success: true,
        message: "Metrics reset successfully",
    });
};
exports.resetMetrics = resetMetrics;
// Readiness check (for Kubernetes/Docker)
const readinessCheck = (req, res) => {
    // Check if all critical services are ready
    const isReady = true; // Would check DB connections, external services, etc.
    res.status(isReady ? 200 : 503).json({
        status: isReady ? "ready" : "not ready",
        timestamp: new Date().toISOString(),
    });
};
exports.readinessCheck = readinessCheck;
// Liveness check (for Kubernetes/Docker)
const livenessCheck = (req, res) => {
    // Simple check to see if the application is alive
    res.status(200).json({
        status: "alive",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
};
exports.livenessCheck = livenessCheck;
// Memory monitoring
const memoryMonitor = () => {
    setInterval(() => {
        const memory = process.memoryUsage();
        const memoryMB = {
            rss: Math.round(memory.rss / 1024 / 1024),
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
            external: Math.round(memory.external / 1024 / 1024),
        };
        // Log memory usage every 5 minutes
        console.log(`Memory Usage - RSS: ${memoryMB.rss}MB, Heap: ${memoryMB.heapUsed}/${memoryMB.heapTotal}MB`);
        // Warn if memory usage is high
        if (memoryMB.heapUsed > 400) {
            console.warn(`HIGH MEMORY USAGE: ${memoryMB.heapUsed}MB heap used`);
        }
        // Force garbage collection if available and memory is very high
        if (global.gc && memoryMB.heapUsed > 450) {
            console.log("Running garbage collection due to high memory usage");
            global.gc();
        }
    }, 5 * 60 * 1000); // Every 5 minutes
};
exports.memoryMonitor = memoryMonitor;
// Error tracking
const errorCounts = new Map();
const errorTracker = (error, req) => {
    const errorKey = `${error.name}: ${error.message}`;
    const count = errorCounts.get(errorKey) || 0;
    errorCounts.set(errorKey, count + 1);
    // Log frequent errors
    if (count + 1 === 5) {
        console.warn(`FREQUENT ERROR: "${errorKey}" has occurred 5 times`);
    }
    else if ((count + 1) % 20 === 0) {
        console.error(`CRITICAL: "${errorKey}" has occurred ${count + 1} times`);
    }
    // Log error details
    console.error(`ERROR: ${req.method} ${req.path} - ${error.name}: ${error.message}`);
    // In production, send to external monitoring service
    if (env_1.env.NODE_ENV === "production") {
        // Would send to Sentry, DataDog, etc.
    }
};
exports.errorTracker = errorTracker;
// Performance alerts
const performanceMonitor = () => {
    setInterval(() => {
        // Check average response time
        if (metrics.responseTime.avg > 2000) {
            console.warn(`PERFORMANCE ALERT: Average response time is ${Math.round(metrics.responseTime.avg)}ms`);
        }
        // Check error rate
        const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
        if (errorRate > 5) {
            console.warn(`ERROR RATE ALERT: ${errorRate.toFixed(2)}% of requests are failing`);
        }
        // Check for specific slow endpoints
        metrics.endpoints.forEach((data, endpoint) => {
            if (data.avgTime > 3000 && data.count > 10) {
                console.warn(`SLOW ENDPOINT: ${endpoint} averaging ${Math.round(data.avgTime)}ms over ${data.count} requests`);
            }
        });
    }, 10 * 60 * 1000); // Every 10 minutes
};
exports.performanceMonitor = performanceMonitor;
// Start background monitoring
const startMonitoring = () => {
    console.log("Starting application monitoring...");
    (0, exports.memoryMonitor)();
    (0, exports.performanceMonitor)();
};
exports.startMonitoring = startMonitoring;
