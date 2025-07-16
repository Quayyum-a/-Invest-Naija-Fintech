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
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const storage_1 = require("../data/storage");
const app = (0, index_1.createServer)();
(0, vitest_1.describe)("Authentication API", () => {
    const testUser = {
        email: "test@example.com",
        password: "TestPassword123!",
        phone: "08012345678",
        firstName: "Test",
        lastName: "User",
    };
    (0, vitest_1.afterEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test user
        const user = (0, storage_1.getUserByEmail)(testUser.email);
        if (user) {
            (0, storage_1.deleteUser)(user.id);
        }
    }));
    (0, vitest_1.describe)("POST /auth/register", () => {
        (0, vitest_1.it)("should register a new user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(testUser)
                .expect(201);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                message: "User registered successfully",
                user: {
                    email: testUser.email,
                    firstName: testUser.firstName,
                    lastName: testUser.lastName,
                    phone: testUser.phone,
                },
            });
            (0, vitest_1.expect)(response.body.token).toBeDefined();
            (0, vitest_1.expect)(response.body.user.password).toBeUndefined();
        }));
        (0, vitest_1.it)("should reject registration with invalid email", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(Object.assign(Object.assign({}, testUser), { email: "invalid-email" }))
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("email");
        }));
        (0, vitest_1.it)("should reject registration with weak password", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(Object.assign(Object.assign({}, testUser), { password: "123" }))
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("password");
        }));
        (0, vitest_1.it)("should reject registration with invalid phone number", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(Object.assign(Object.assign({}, testUser), { phone: "123" }))
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("phone");
        }));
        (0, vitest_1.it)("should reject duplicate email registration", () => __awaiter(void 0, void 0, void 0, function* () {
            // Register user first time
            yield (0, supertest_1.default)(app).post("/auth/register").send(testUser).expect(201);
            // Try to register again
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(testUser)
                .expect(409);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("already exists");
        }));
    });
    (0, vitest_1.describe)("POST /auth/login", () => {
        (0, vitest_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
            // Register test user
            yield (0, supertest_1.default)(app).post("/auth/register").send(testUser);
        }));
        (0, vitest_1.it)("should login with valid credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send({
                email: testUser.email,
                password: testUser.password,
            })
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                message: "Login successful",
                user: {
                    email: testUser.email,
                    firstName: testUser.firstName,
                    lastName: testUser.lastName,
                },
            });
            (0, vitest_1.expect)(response.body.token).toBeDefined();
            (0, vitest_1.expect)(response.body.user.password).toBeUndefined();
        }));
        (0, vitest_1.it)("should reject login with invalid email", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send({
                email: "nonexistent@example.com",
                password: testUser.password,
            })
                .expect(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toBe("Invalid credentials");
        }));
        (0, vitest_1.it)("should reject login with invalid password", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/login")
                .send({
                email: testUser.email,
                password: "wrongpassword",
            })
                .expect(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toBe("Invalid credentials");
        }));
    });
    (0, vitest_1.describe)("GET /auth/me", () => {
        let authToken;
        (0, vitest_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
            // Register and login to get token
            const registerResponse = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(testUser);
            authToken = registerResponse.body.token;
        }));
        (0, vitest_1.it)("should return current user with valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/auth/me")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                user: {
                    email: testUser.email,
                    firstName: testUser.firstName,
                    lastName: testUser.lastName,
                },
            });
        }));
        (0, vitest_1.it)("should reject request without token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/auth/me").expect(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("token");
        }));
        (0, vitest_1.it)("should reject request with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/auth/me")
                .set("Authorization", "Bearer invalid-token")
                .expect(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("token");
        }));
    });
    (0, vitest_1.describe)("POST /auth/logout", () => {
        let authToken;
        (0, vitest_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
            const registerResponse = yield (0, supertest_1.default)(app)
                .post("/auth/register")
                .send(testUser);
            authToken = registerResponse.body.token;
        }));
        (0, vitest_1.it)("should logout successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/auth/logout")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                success: true,
                message: "Logged out successfully",
            });
        }));
        (0, vitest_1.it)("should handle logout without token gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/auth/logout").expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
        }));
    });
});
