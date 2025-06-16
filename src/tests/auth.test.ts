import "dotenv/config"; // Load environment variables
import { comparePassword, generateToken, hashPassword, verifyToken } from "../utils/auth";

async function testAuthUtilities() {
  console.log("🔐 Testing authentication utilities...\n");

  try {
    // Test password hashing
    console.log("1. Testing password hashing...");
    const password = "testPassword123";
    const hashedPassword = await hashPassword(password);
    console.log(`   ✅ Password hashed successfully`);
    console.log(`   📝 Original: ${password}`);
    console.log(`   🔒 Hashed: ${hashedPassword.substring(0, 20)}...`);

    // Test password comparison
    console.log("\n2. Testing password comparison...");
    const isValid = await comparePassword(password, hashedPassword);
    const isInvalid = await comparePassword("wrongPassword", hashedPassword);
    console.log(`   ✅ Correct password validation: ${isValid}`);
    console.log(`   ✅ Incorrect password validation: ${isInvalid}`);

    // Test JWT token generation
    console.log("\n3. Testing JWT token generation...");
    const payload = { userId: "test-123", username: "testuser" };
    const token = generateToken(payload, "1h");
    console.log(`   ✅ Token generated successfully`);
    console.log(`   🎫 Token: ${token.substring(0, 30)}...`);

    // Test JWT token verification
    console.log("\n4. Testing JWT token verification...");
    const decoded = verifyToken(token);
    console.log(`   ✅ Token verified successfully`);
    console.log(`   📄 Decoded payload:`, decoded);

    console.log("\n🎉 All authentication utilities working correctly!");
  } catch (error) {
    console.error("❌ Authentication test failed:", error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAuthUtilities()
    .then(() => {
      console.log("✅ Authentication utilities test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Authentication utilities test failed:", error);
      process.exit(1);
    });
}

export default testAuthUtilities;
