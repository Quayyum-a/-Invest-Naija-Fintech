import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { createServer } from "../index";
import { initializeApp } from "../data/init";

const app = createServer();

describe("Authentication API", () => {
  beforeEach(async () => {
    await initializeApp();
  });

  describe("POST /auth/register", () => {
    it("should register a new user with valid data", async () => {
      const userData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it("should reject registration with invalid email", async () => {
      const userData = {
        email: "invalid-email",
        password: "TestPass123",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject registration with weak password", async () => {
      const userData = {
        email: "test@example.com",
        password: "weak",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject registration with invalid Nigerian phone number", async () => {
      const userData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+1234567890", // US number
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should prevent duplicate email registration", async () => {
      const userData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };

      // First registration
      await request(app).post("/auth/register").send(userData).expect(201);

      // Second registration with same email
      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("User with this email already exists");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Register a test user
      const userData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };
      await request(app).post("/auth/register").send(userData);
    });

    it("should login with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "TestPass123",
      };

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.password).toBeUndefined();
    });

    it("should reject login with invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "TestPass123",
      };

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should reject login with invalid password", async () => {
      const loginData = {
        email: "test@example.com",
        password: "WrongPassword",
      };

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should reject login with missing fields", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });
  });

  describe("GET /auth/me", () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const userData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };
      await request(app).post("/auth/register").send(userData);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: userData.email, password: userData.password });

      authToken = loginResponse.body.token;
    });

    it("should get current user with valid token", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("test@example.com");
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/auth/me").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Access token required");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid or expired token");
    });
  });

  describe("POST /auth/logout", () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const userData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };
      await request(app).post("/auth/register").send(userData);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: userData.email, password: userData.password });

      authToken = loginResponse.body.token;
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Logged out successfully");
    });

    it("should logout even without token", async () => {
      const response = await request(app).post("/auth/logout").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Logged out successfully");
    });
  });
});
