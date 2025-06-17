import { PrismaClient } from "@prisma/client";
import express from "express";
import request from "supertest";
import { errorHandler } from "../src/middleware/error";
import authRoutes from "../src/routes/auth";
import feedRoutes from "../src/routes/feed";
import postsRoutes from "../src/routes/posts";

const prisma = new PrismaClient();

// Create test app without rate limiting and security middleware
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postsRoutes);
  app.use("/api/feed", feedRoutes);
  app.use(errorHandler);
  return app;
};

describe("Posts and Feed Endpoints", () => {
  let app: express.Application;
  let authToken: string;
  let userId: string;
  let postId: string;

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

    // Create and login a test user
    const userData = {
      email: "test@example.com",
      password: "   Test123!@#",
      name: "Test User",
      username: "testuser",
    };

    const registerResponse = await request(app).post("/api/auth/register").send(userData);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.data.id;
  });

  describe("POST /api/posts", () => {
    test("should create a new post successfully", async () => {
      const postData = {
        text: "This is a test post",
      };

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("text", postData.text);
      expect(response.body.data).toHaveProperty("author");
      expect(response.body.data.author).toHaveProperty("id", userId);
      expect(response.body.data).toHaveProperty("createdAt");

      postId = response.body.data.id;
    });

    test("should fail without authentication", async () => {
      const postData = {
        text: "This is a test post",
      };

      const response = await request(app).post("/api/posts").send(postData).expect(401);

      expect(response.body).toHaveProperty("error");
    });

    test("should fail with empty content", async () => {
      const postData = {
        text: "",
      };

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(postData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/posts/:id", () => {
    beforeEach(async () => {
      // Create a test post
      const postData = {
        text: "This is a test post",
      };

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(postData);

      postId = response.body.data.id;
    });

    test("should get a post successfully", async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty("id", postId);
      expect(response.body.data).toHaveProperty("text", "This is a test post");
      expect(response.body.data).toHaveProperty("author");
      expect(response.body.data.author).toHaveProperty("username", "testuser");
    });

    test("should fail for non-existent post", async () => {
      const response = await request(app)
        .get("/api/posts/nonexistent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/feed", () => {
    beforeEach(async () => {
      // Create another user and some posts
      const otherUserData = {
        email: "other@example.com",
        password: "Test123!@#",
        name: "Other User",
        username: "otheruser",
      };

      const otherUserResponse = await request(app).post("/api/auth/register").send(otherUserData);

      // Create some posts
      await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ text: "My first post" });

      await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${otherUserResponse.body.token}`)
        .send({ text: "Other user's post" });
    });

    test("should get feed successfully", async () => {
      const response = await request(app)
        .get("/api/feed")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test("should fail without authentication", async () => {
      const response = await request(app).get("/api/feed").expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });
});
