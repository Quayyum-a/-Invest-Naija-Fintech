"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const init_1 = require("../data/init");
const app = (0, index_1.createServer)();
(0, globals_1.describe)("Authentication API", () => {
    (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, init_1.initializeApp)();
    }));
    (0, globals_1.describe)("POST /auth/register", () => {
        (0, globals_1.it)("should register a new user with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "test@example.com",
                password: "TestPass123",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(userData)
                .expect(201);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.user).toBeDefined();
            (0, globals_1.expect)(response.body.token).toBeDefined();
            (0, globals_1.expect)(response.body.user.email).toBe(userData.email);
            (0, globals_1.expect)(response.body.user.password).toBeUndefined(); // Password should not be returned
        }));
        (0, globals_1.it)("should reject registration with invalid email", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "invalid-email",
                password: "TestPass123",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(userData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should reject registration with weak password", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "test@example.com",
                password: "weak",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(userData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should reject registration with invalid Nigerian phone number", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "test@example.com",
                password: "TestPass123",
                phone: "+1234567890", // US number
                firstName: "John",
                lastName: "Doe",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(userData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should prevent duplicate email registration", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "test@example.com",
                password: "TestPass123",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            };
            // First registration
            yield (0, supertest_1.default)(app).post("/auth/register").send(userData).expect(201);
            // Second registration with same email
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(userData)
                .expect(409);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("User with this email already exists");
        }));
    });
    (0, globals_1.describe)("POST /auth/login", () => {
        (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
            // Register a test user
            const userData = {
                email: "test@example.com",
                password: "TestPass123",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            };
            yield (0, supertest_1.default)(app).post("/auth/register").send(userData);
        }));
        (0, globals_1.it)("should login with valid credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            const loginData = {
                email: "test@example.com",
                password: "TestPass123",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send(loginData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.user).toBeDefined();
            (0, globals_1.expect)(response.body.token).toBeDefined();
            (0, globals_1.expect)(response.body.user.email).toBe(loginData.email);
            (0, globals_1.expect)(response.body.user.password).toBeUndefined();
        }));
        (0, globals_1.it)("should reject login with invalid email", () => __awaiter(void 0, void 0, void 0, function* () {
            const loginData = {
                email: "nonexistent@example.com",
                password: "TestPass123",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send(loginData)
                .expect(401);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Invalid credentials");
        }));
        (0, globals_1.it)("should reject login with invalid password", () => __awaiter(void 0, void 0, void 0, function* () {
            const loginData = {
                email: "test@example.com",
                password: "WrongPassword",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send(loginData)
                .expect(401);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Invalid credentials");
        }));
        (0, globals_1.it)("should reject login with missing fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send({ email: "test@example.com" })
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
    });
    (0, globals_1.describe)("GET /auth/me", () => {
        let authToken;
        (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
            // Register and login to get token
            const userData = {
                email: "test@example.com",
                password: "TestPass123",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            };
            yield (0, supertest_1.default)(app).post("/auth/register").send(userData);
            const loginResponse = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password });
            authToken = loginResponse.body.token;
        }));
        (0, globals_1.it)("should get current user with valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/auth/me")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.user).toBeDefined();
            (0, globals_1.expect)(response.body.user.email).toBe("test@example.com");
        }));
        (0, globals_1.it)("should reject request without token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/auth/me").expect(401);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Access token required");
        }));
        (0, globals_1.it)("should reject request with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/auth/me")
                .set("Authorization", "Bearer invalid-token")
                .expect(403);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Invalid or expired token");
        }));
    });
    (0, globals_1.describe)("POST /auth/logout", () => {
        let authToken;
        (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
            // Register and login to get token
            const userData = {
                email: "test@example.com",
                password: "TestPass123",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            };
            yield (0, supertest_1.default)(app).post("/auth/register").send(userData);
            const loginResponse = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password });
            authToken = loginResponse.body.token;
        }));
        (0, globals_1.it)("should logout successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/logout")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.message).toBe("Logged out successfully");
        }));
        (0, globals_1.it)("should logout even without token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/auth/logout").expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.message).toBe("Logged out successfully");
        }));
    });
});
