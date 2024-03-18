# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set environment to production
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S investnaija -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=investnaija:nodejs /app/dist ./dist

# Copy public assets if they exist
COPY --from=builder --chown=investnaija:nodejs /app/public ./public

# Set ownership of the app directory
RUN chown -R investnaija:nodejs /app

# Switch to non-root user
USER investnaija

# Expose port (configurable via environment)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/ping || exit 1

# Start the application
CMD ["npm", "start"]
