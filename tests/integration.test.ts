import { PrismaClient } from "@prisma/client";
import express from "express";
import request from "supertest";
import { getProfile, login, register } from "../src/controllers/auth";
import { createPost, getFeed } from "../src/controllers/posts";
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

  // Post routes
  app.post("/api/posts", authenticateToken, createPost);
  app.get("/api/feed", authenticateToken, getFeed);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", environment: "test" });
  });

  app.use(errorHandler);
  return app;
};

describe("Integration Tests", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createTestApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.post.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe("Complete Social Media Flow", () => {
    test("should complete a full social media user journey", async () => {
      // Step 1: Register two users
      const user1Data = {
        email: "alice@example.com",
        password: "Test123!@#",
        name: "Alice Smith",
        username: "alice",
      };

      const user2Data = {
        email: "bob@example.com",
        password: "Test123!@#",
        name: "Bob Johnson",
        username: "bob",
      };

      const user1Response = await request(app)
        .post("/api/auth/register")
        .send(user1Data)
        .expect(201);

      const user2Response = await request(app)
        .post("/api/auth/register")
        .send(user2Data)
        .expect(201);

      const user1Token = user1Response.body.token;
      const user2Token = user2Response.body.token;
      const user1Id = user1Response.body.data.id;
      const user2Id = user2Response.body.data.id;

      // Step 2: User 1 follows User 2
      await request(app)
        .post(`/api/users/${user2Id}/follow`)
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(201);

      // Step 3: User 2 creates a post
      const postResponse = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ text: "Hello from Bob!" })
        .expect(201);

      const postId = postResponse.body.id;

      // Step 4: User 1 creates a post
      await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ text: "Hello from Alice!" })
        .expect(201);

      // Step 5: User 1 checks their feed (should see both posts)
      const feedResponse = await request(app)
        .get("/api/feed")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      expect(feedResponse.body).toHaveProperty("data");
      expect(Array.isArray(feedResponse.body.data)).toBe(true);
      expect(feedResponse.body.data.length).toBeGreaterThan(0);

      // Step 6: User 1 unfollows User 2
      await request(app)
        .delete(`/api/users/${user2Id}/follow`)
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid authentication tokens", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    test("should handle missing authentication", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body).toHaveProperty("error");
    });

    test("should handle invalid JSON in request body", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Content-Type", "application/json")
        .send("invalid json")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("API Health Check", () => {
    test("should return healthy status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("environment", "test");
    });
  });

  describe("Input Validation", () => {
    test("should validate email format", async () => {
      const userData = {
        email: "invalid-email",
        password: "Test123!@#",
        name: "Test User",
        username: "testuser",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should validate password strength", async () => {
      const userData = {
        email: "test@example.com",
        password: "weak",
        name: "Test User",
        username: "testuser",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should validate required fields", async () => {
      const response = await request(app).post("/api/auth/register").send({}).expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
