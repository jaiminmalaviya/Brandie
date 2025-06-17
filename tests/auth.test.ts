import { PrismaClient } from "@prisma/client";
import express from "express";
import request from "supertest";
import { login, register } from "../src/controllers/auth";
import { errorHandler } from "../src/middleware/error";
import { sanitizeContent } from "../src/middleware/index";
import { validateLogin, validateRegister } from "../src/middleware/validation";

const prisma = new PrismaClient();

// Create test app without rate limiting
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Auth routes without rate limiting
  app.post("/api/auth/register", sanitizeContent, validateRegister, register);
  app.post("/api/auth/login", validateLogin, login);

  app.use(errorHandler);
  return app;
};

describe("Authentication Endpoints", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createTestApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up users table before each test
    await prisma.user.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "Test123!@#",
        name: "Test User",
        username: "testuser",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("token");
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data).not.toHaveProperty("password");
    });

    test("should fail with invalid email", async () => {
      const userData = {
        email: "invalid-email",
        password: "Test123!@#",
        name: "Test User",
        username: "testuser",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should fail with weak password", async () => {
      const userData = {
        email: "test@example.com",
        password: "123",
        name: "Test User",
        username: "testuser",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should fail with duplicate email", async () => {
      const userData = {
        email: "test@example.com",
        password: "Test123!@#",
        name: "Test User",
        username: "testuser",
      };

      // Register first user
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Try to register with same email
      const duplicateUser = {
        ...userData,
        username: "testuser2",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicateUser)
        .expect(409);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const userData = {
        email: "test@example.com",
        password: "Test123!@#",
        name: "Test User",
        username: "testuser",
      };

      await request(app).post("/api/auth/register").send(userData);
    });

    test("should login successfully with valid credentials", async () => {
      const loginData = {
        username: "test@example.com",
        password: "Test123!@#",
      };

      const response = await request(app).post("/api/auth/login").send(loginData).expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("token");
      expect(response.body.data.email).toBe(loginData.username);
      expect(response.body.data).not.toHaveProperty("password");
    });

    test("should fail with invalid email", async () => {
      const loginData = {
        username: "nonexistent@example.com",
        password: "Test123!@#",
      };

      const response = await request(app).post("/api/auth/login").send(loginData).expect(401);

      expect(response.body).toHaveProperty("error");
    });

    test("should fail with invalid password", async () => {
      const loginData = {
        username: "test@example.com",
        password: "WrongPassword123!",
      };

      const response = await request(app).post("/api/auth/login").send(loginData).expect(401);

      expect(response.body).toHaveProperty("error");
    });

    test("should fail with missing fields", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "test@example.com" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
