import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Create sample users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      username: "john_doe",
      email: "john@example.com",
      password: hashedPassword,
      name: "John Doe",
      bio: "Software developer and tech enthusiast",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      username: "jane_smith",
      email: "jane@example.com",
      password: hashedPassword,
      name: "Jane Smith",
      bio: "Designer and creative thinker",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      username: "bob_wilson",
      email: "bob@example.com",
      password: hashedPassword,
      name: "Bob Wilson",
      bio: "Product manager and startup advisor",
    },
  });

  console.log("Created users:", {
    user1: user1.username,
    user2: user2.username,
    user3: user3.username,
  });

  // Create sample posts
  const post1 = await prisma.post.create({
    data: {
      text: "Hello world! This is my first post on Brandie.",
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      text: "Excited to be part of this new social platform! 🚀",
      authorId: user2.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      text: "Working on some amazing new features. Stay tuned!",
      authorId: user1.id,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      text: "Beautiful day for coding! ☀️ What are you working on today?",
      authorId: user3.id,
    },
  });

  console.log("Created posts:", {
    post1: post1.text.slice(0, 30) + "...",
    post2: post2.text.slice(0, 30) + "...",
    post3: post3.text.slice(0, 30) + "...",
    post4: post4.text.slice(0, 30) + "...",
  });

  // Create follow relationships
  const follow1 = await prisma.follow.create({
    data: {
      followerId: user1.id,
      followeeId: user2.id,
    },
  });

  const follow2 = await prisma.follow.create({
    data: {
      followerId: user2.id,
      followeeId: user3.id,
    },
  });

  const follow3 = await prisma.follow.create({
    data: {
      followerId: user3.id,
      followeeId: user1.id,
    },
  });

  const follow4 = await prisma.follow.create({
    data: {
      followerId: user1.id,
      followeeId: user3.id,
    },
  });

  console.log("Created follow relationships:", {
    follow1: `${user1.username} follows ${user2.username}`,
    follow2: `${user2.username} follows ${user3.username}`,
    follow3: `${user3.username} follows ${user1.username}`,
    follow4: `${user1.username} follows ${user3.username}`,
  });

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
