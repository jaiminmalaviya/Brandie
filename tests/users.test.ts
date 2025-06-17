import { PrismaClient } from "@prisma/client";
import express from "express";
import request from "supertest";
import { getProfile, login, register } from "../src/controllers/auth";
import { followUser, unfollowUser } from "../src/controllers/users";
import { errorHandler } from "../src/middleware/error";
import { authenticateToken, sanitizeContent } from "../src/middleware/index";
import { validateLogin, validateRegister } from "../src/middleware/validation";

const prisma = new PrismaClient();

// Create test app without rate limiting
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Auth routes without rate limiting
  app.post("/api/auth/register", sanitizeContent, validateRegister, register);
  app.post("/api/auth/login", validateLogin, login);
  app.get("/api/auth/me", authenticateToken, getProfile);

  // User routes
  app.post("/api/users/:id/follow", authenticateToken, followUser);
  app.delete("/api/users/:id/follow", authenticateToken, unfollowUser);

  app.use(errorHandler);
  return app;
};

describe("Users Endpoints", () => {
  let app: express.Application;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = createTestApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.follow.deleteMany({});
    await prisma.user.deleteMany({});

    // Create and login a test user
    const userData = {
      email: "test@example.com",
      password: "Test123!@#",
      name: "Test User",
      username: "testuser",
    };

    const registerResponse = await request(app).post("/api/auth/register").send(userData);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.data.id;
  });

  describe("GET /api/auth/me", () => {
    test("should get user profile successfully", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("email", "test@example.com");
      expect(response.body.data).toHaveProperty("name", "Test User");
      expect(response.body.data).toHaveProperty("username", "testuser");
      expect(response.body.data).not.toHaveProperty("password");
    });

    test("should fail without authentication", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/users/:id/follow", () => {
    let targetUserId: string;

    beforeEach(async () => {
      // Create a target user to follow
      const targetUser = {
        email: "target@example.com",
        password: "Test123!@#",
        name: "Target User",
        username: "target",
      };

      const response = await request(app).post("/api/auth/register").send(targetUser);

      targetUserId = response.body.data.id;
    });

    test("should follow a user successfully", async () => {
      const response = await request(app)
        .post(`/api/users/${targetUserId}/follow`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty("message");
    });

    test("should fail without authentication", async () => {
      const response = await request(app).post(`/api/users/${targetUserId}/follow`).expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });
});
