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
    await prisma.like.deleteMany({});
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

    // Create a test post for tests that need it
    const postData = {
      text: "Test post for like functionality",
    };

    const postResponse = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send(postData)
      .expect(201); // Ensure the post is created successfully

    if (!postResponse.body.data || !postResponse.body.data.id) {
      throw new Error(`Failed to create test post: ${JSON.stringify(postResponse.body)}`);
    }

    postId = postResponse.body.data.id;
  });

  describe("POST /api/posts", () => {
    test("should create a new post successfully", async () => {
      const postData = {
        text: "This is another test post",
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
      expect(response.body.data).toHaveProperty("likeCount", 0);
      expect(response.body.data).toHaveProperty("isLiked", false);
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

  describe("POST /api/posts/:id/like", () => {
    test("should like a post successfully", async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Post liked successfully");
      expect(response.body.data).toHaveProperty("postId", postId);
      expect(response.body.data).toHaveProperty("userId", userId);
    });

    test("should fail when trying to like the same post twice", async () => {
      // First like
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201);

      // Second like should fail
      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Post already liked");
    });

    test("should fail without authentication", async () => {
      const response = await request(app).post(`/api/posts/${postId}/like`).expect(401);

      expect(response.body).toHaveProperty("error");
    });

    test("should fail for non-existent post", async () => {
      const response = await request(app)
        .post("/api/posts/nonexistent-id/like")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error", "Post not found");
    });
  });

  describe("DELETE /api/posts/:id/like", () => {
    beforeEach(async () => {
      // Like the post first
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);
    });

    test("should unlike a post successfully", async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Post unliked successfully");
      expect(response.body.data).toHaveProperty("postId", postId);
      expect(response.body.data).toHaveProperty("userId", userId);
    });

    test("should fail when trying to unlike a post that wasn't liked", async () => {
      // Unlike first
      await request(app)
        .delete(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);

      // Second unlike should fail
      const response = await request(app)
        .delete(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Post not liked yet");
    });

    test("should fail without authentication", async () => {
      const response = await request(app).delete(`/api/posts/${postId}/like`).expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/posts/:id/likes", () => {
    beforeEach(async () => {
      // Like the post
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);
    });

    test("should get post likes successfully", async () => {
      const response = await request(app).get(`/api/posts/${postId}/likes`).expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty("user");
      expect(response.body.data[0].user).toHaveProperty("username", "testuser");
    });

    test("should return empty array for post with no likes", async () => {
      // Unlike the post first
      await request(app)
        .delete(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);

      const response = await request(app).get(`/api/posts/${postId}/likes`).expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    test("should fail for non-existent post", async () => {
      const response = await request(app).get("/api/posts/nonexistent-id/likes").expect(404);

      expect(response.body).toHaveProperty("error", "Post not found");
    });
  });

  describe("Like functionality in posts", () => {
    test("should include like count and isLiked in post response", async () => {
      // Like the post
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty("likeCount", 1);
      expect(response.body.data).toHaveProperty("isLiked", true);
    });

    test("should include like count and isLiked in feed response", async () => {
      // Like the post
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${authToken}`);

      const response = await request(app)
        .get("/api/feed")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data[0]).toHaveProperty("likeCount", 1);
      expect(response.body.data[0]).toHaveProperty("isLiked", true);
    });
  });
});
