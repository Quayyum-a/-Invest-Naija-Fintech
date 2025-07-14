import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createServer } from "../index";
import { getUserByEmail, deleteUser } from "../data/storage";

const app = createServer();

describe("Authentication API", () => {
  const testUser = {
    email: "test@example.com",
    password: "TestPassword123!",
    phone: "08012345678",
    firstName: "Test",
    lastName: "User",
  };

  afterEach(async () => {
    // Clean up test user
    const user = getUserByEmail(testUser.email);
    if (user) {
      deleteUser(user.id);
    }
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send(testUser)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "User registered successfully",
        user: {
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          phone: testUser.phone,
        },
      });

      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...testUser,
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("email");
    });

    it("should reject registration with weak password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...testUser,
          password: "123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("password");
    });

    it("should reject registration with invalid phone number", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...testUser,
          phone: "123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("phone");
    });

    it("should reject duplicate email registration", async () => {
      // Register user first time
      await request(app).post("/auth/register").send(testUser).expect(201);

      // Try to register again
      const response = await request(app)
        .post("/auth/register")
        .send(testUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already exists");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Register test user
      await request(app).post("/auth/register").send(testUser);
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Login successful",
        user: {
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        },
      });

      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it("should reject login with invalid email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("GET /auth/me", () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(testUser);

      authToken = registerResponse.body.token;
    });

    it("should return current user with valid token", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        },
      });
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/auth/me").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("token");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("token");
    });
  });

  describe("POST /auth/logout", () => {
    let authToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(testUser);

      authToken = registerResponse.body.token;
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Logged out successfully",
      });
    });

    it("should handle logout without token gracefully", async () => {
      const response = await request(app).post("/auth/logout").expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
