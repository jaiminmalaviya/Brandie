import "dotenv/config"; // Load environment variables
import { DatabaseService, FollowService, PostService, UserService } from "../services/database";

async function runComprehensiveTest() {
  console.log("🧪 Running comprehensive database test...\n");

  try {
    // Test database health
    console.log("1. Testing database health...");
    const isHealthy = await DatabaseService.healthCheck();
    console.log(`   ✅ Database health: ${isHealthy ? "OK" : "FAILED"}\n`);

    // Test total counts
    console.log("2. Getting total counts...");
    const counts = await DatabaseService.getTotalCounts();
    console.log(
      `   📊 Users: ${counts.users}, Posts: ${counts.posts}, Follows: ${counts.follows}\n`
    );

    // Test user operations
    console.log("3. Testing user operations...");
    const users = await UserService.searchUsers("john", 5);
    console.log(`   👥 Found ${users.length} users matching "john"`);

    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`   👤 First user: ${firstUser.username} (${firstUser.email})`);

      // Get user with counts
      const userWithCounts = await UserService.getUserWithCounts(firstUser.id);
      if (userWithCounts) {
        console.log(
          `   📈 User stats: ${userWithCounts._count.posts} posts, ${userWithCounts._count.followers} followers, ${userWithCounts._count.following} following`
        );
      }
    }
    console.log();

    // Test post operations
    console.log("4. Testing post operations...");
    const posts = await PostService.getPostsWithAuthors(5);
    console.log(`   📝 Found ${posts.length} posts with authors`);

    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log(
        `   📄 First post: "${firstPost.text.slice(0, 50)}..." by ${firstPost.author.username}`
      );
    }
    console.log();

    // Test follow operations
    console.log("5. Testing follow operations...");
    if (users.length > 0) {
      const userId = users[0].id;
      const followers = await FollowService.getFollowers(userId);
      const following = await FollowService.getFollowing(userId);
      const followCounts = await FollowService.getFollowCounts(userId);

      console.log(
        `   👥 User ${users[0].username} has ${followers.length} followers and follows ${following.length} users`
      );
      console.log(
        `   📊 Follow counts: ${followCounts.followers} followers, ${followCounts.following} following`
      );

      if (following.length > 0) {
        const isFollowingFirst = await FollowService.isFollowing(userId, following[0].id);
        console.log(`   🔍 Is following ${following[0].username}: ${isFollowingFirst}`);
      }
    }
    console.log();

    // Test timeline
    console.log("6. Testing timeline...");
    if (users.length > 0) {
      const timeline = await PostService.getTimeline(users[0].id, 5);
      console.log(`   📰 Timeline has ${timeline.length} posts`);
      timeline.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.text.slice(0, 40)}..." by ${post.author.username}`);
      });
    }

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await DatabaseService.disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runComprehensiveTest()
    .then(() => {
      console.log("✅ Comprehensive test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Comprehensive test failed:", error);
      process.exit(1);
    });
}

export default runComprehensiveTest;
