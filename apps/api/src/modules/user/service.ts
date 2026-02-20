import type { PrismaClient, User } from "@rezumerai/database";

/**
 * User service — business logic only, no HTTP concerns.
 * Uses abstract class (no allocation needed) with static methods receiving db via parameter.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Pattern is intentional for service classes with only static methods.
export abstract class UserService {
  /**
   * Retrieves all users.
   *
   * @param db - Prisma client instance
   * @returns Array of all user records
   */
  static async findAll(db: PrismaClient): Promise<User[]> {
    const users = await db.user.findMany();
    return users;
  }

  /**
   * Finds a user by their unique identifier.
   *
   * @param db - Prisma client instance
   * @param id - User ID to look up
   * @returns User record if found, null otherwise
   */
  static async findById(db: PrismaClient, id: string): Promise<User | null> {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  }

  /**
   * Finds a user by their email address.
   *
   * @param db - Prisma client instance
   * @param email - User email to look up
   * @returns User record if found, null otherwise
   */
  static async findByEmail(db: PrismaClient, email: string): Promise<User | null> {
    const user = await db.user.findUnique({ where: { email } });
    return user;
  }

  /**
   * Updates a user's information.
   *
   * @param db - Prisma client instance
   * @param id - User ID to update
   * @param data - Partial user data to update (e.g. name, email)
   * @returns The updated user record
   */
  static async update(db: PrismaClient, id: string, data: Partial<User>): Promise<User> {
    const user = await db.user.update({ where: { id }, data });
    return user;
  }

  /**
   * Creates a new user with the provided input data.
   * NOTE: User creation is handled by Better Auth — implement only if needed for admin features.
   *
   * @param db - Prisma client instance
   * @param input - Data for the new user (name and email)
   * @returns The created user record
   */
  // static async create(db: PrismaClient, input: CreateUserInput): Promise<User> {
  //   return db.user.create({ data: input });
  // }
}
