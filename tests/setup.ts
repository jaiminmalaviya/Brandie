import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Global test setup
let prisma: PrismaClient;

beforeAll(async () => {
  // Initialize Prisma client for tests
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  });

  // Connect to database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup after all tests
  if (prisma) {
    await prisma.$disconnect();
  }
});

// Helper function to clean database before each test
export const cleanDatabase = async () => {
  if (prisma) {
    // Delete in correct order to respect foreign key constraints
    await prisma.follow.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  }
};

// Export prisma instance for tests
export { prisma };
