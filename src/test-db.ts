import prisma from "./db";

async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);

    const postCount = await prisma.post.count();
    console.log(`📊 Current post count: ${postCount}`);

    const followCount = await prisma.follow.count();
    console.log(`📊 Current follow count: ${followCount}`);

    console.log("✅ Database queries working correctly");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log("🎉 Database test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Database test failed:", error);
      process.exit(1);
    });
}

export default testConnection;
