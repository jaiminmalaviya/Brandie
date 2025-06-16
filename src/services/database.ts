import prisma from "../db";
import {
  Follow,
  Post,
  PostCreateInput,
  PostWithAuthor,
  User,
  UserCreateInput,
  UserWithCounts,
  UserWithPosts,
} from "../types";

/**
 * User utilities
 */
export class UserService {
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async create(data: UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  static async update(id: string, data: Partial<UserCreateInput>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  static async getUserWithCounts(id: string): Promise<UserWithCounts | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    return user as UserWithCounts | null;
  }

  static async getUserWithPosts(id: string): Promise<UserWithPosts | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: limit,
    });
  }
}

/**
 * Post utilities
 */
export class PostService {
  static async findById(id: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
    });
  }

  static async create(data: PostCreateInput): Promise<Post> {
    return prisma.post.create({
      data,
    });
  }

  static async update(id: string, data: Partial<PostCreateInput>): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<Post> {
    return prisma.post.delete({
      where: { id },
    });
  }

  static async getPostWithAuthor(id: string): Promise<PostWithAuthor | null> {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });
  }

  static async getPostsByUser(userId: string, limit: number = 20): Promise<Post[]> {
    return prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  static async getPostsWithAuthors(
    limit: number = 20,
    skip: number = 0
  ): Promise<PostWithAuthor[]> {
    return prisma.post.findMany({
      include: {
        author: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
  }

  static async getTimeline(userId: string, limit: number = 20): Promise<PostWithAuthor[]> {
    // Get posts from users that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    });

    const followingIds = following.map((f: { followeeId: string }) => f.followeeId);
    followingIds.push(userId); // Include own posts

    return prisma.post.findMany({
      where: {
        authorId: {
          in: followingIds,
        },
      },
      include: {
        author: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

/**
 * Follow utilities
 */
export class FollowService {
  static async follow(followerId: string, followeeId: string): Promise<Follow> {
    return prisma.follow.create({
      data: {
        followerId,
        followeeId,
      },
    });
  }

  static async unfollow(followerId: string, followeeId: string): Promise<Follow> {
    return prisma.follow.delete({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });
  }

  static async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });
    return !!follow;
  }

  static async getFollowers(userId: string): Promise<User[]> {
    const follows = await prisma.follow.findMany({
      where: { followeeId: userId },
      include: {
        follower: true,
      },
    });
    return follows.map((f: any) => f.follower);
  }

  static async getFollowing(userId: string): Promise<User[]> {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        followee: true,
      },
    });
    return follows.map((f: any) => f.followee);
  }

  static async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followers, following] = await Promise.all([
      prisma.follow.count({ where: { followeeId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followers, following };
  }
}

/**
 * General database utilities
 */
export class DatabaseService {
  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  static async getTotalCounts(): Promise<{ users: number; posts: number; follows: number }> {
    const [users, posts, follows] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.follow.count(),
    ]);
    return { users, posts, follows };
  }

  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export default services
export default { UserService, PostService, FollowService, DatabaseService };
