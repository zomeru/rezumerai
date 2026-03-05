import type { PrismaClient, User } from "@rezumerai/database";
import type { UserAccountSettings } from "@rezumerai/types";
import { AiService } from "../ai/service";

const CREDENTIAL_PROVIDER_IDS = new Set<string>(["credential", "email-password"]);

const SOCIAL_EMAIL_READ_ONLY_REASON = "Email is managed by your social auth provider and cannot be updated here.";
const SOCIAL_PASSWORD_READ_ONLY_REASON =
  "Password is managed by your social auth provider. Use that provider to update it.";
const LOCAL_PASSWORD_READ_ONLY_REASON = "Password updates are not available from account settings yet.";

/**
 * User service — business logic only, no HTTP concerns.
 * Uses abstract class (no state stored) with static methods receiving db via
 * parameter, following the Elysia best-practice pattern.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Elysia best practice — abstract class avoids allocation when no state is stored.
export abstract class UserService {
  /**
   * Retrieves all users.
   *
   * @param db - Prisma client instance
   * @returns Array of all user records
   */
  static async findAll(db: PrismaClient): Promise<User[]> {
    return db.user.findMany();
  }

  /**
   * Finds a user by their unique identifier.
   *
   * @param db - Prisma client instance
   * @param id - User ID to look up
   * @returns User record if found, null otherwise
   */
  static async findById(db: PrismaClient, id: string): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  }

  /**
   * Finds a user by their email address.
   *
   * @param db - Prisma client instance
   * @param email - User email to look up
   * @returns User record if found, null otherwise
   */
  static async findByEmail(db: PrismaClient, email: string): Promise<User | null> {
    return db.user.findUnique({ where: { email } });
  }

  /**
   * Updates a user's information.
   *
   * @param db - Prisma client instance
   * @param id - User ID to update
   * @param data - Partial user data to update (e.g. name, email)
   * @returns The updated user record, or null if the user does not exist
   */
  static async update(db: PrismaClient, id: string, data: Partial<User>): Promise<User | null> {
    const exists = await db.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return null;
    return db.user.update({ where: { id }, data });
  }

  static async getAccountSettings(db: PrismaClient, userId: string): Promise<UserAccountSettings | null> {
    const [user, accounts, credits] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
      }),
      db.account.findMany({
        where: { userId },
        select: {
          providerId: true,
          password: true,
        },
      }),
      AiService.getDailyCredits(db, userId),
    ]);

    if (!user) return null;

    const providers = accounts.map((account) => ({
      providerId: account.providerId,
      hasPassword: account.password !== null || CREDENTIAL_PROVIDER_IDS.has(account.providerId),
    }));

    const hasSocialProvider = providers.some((provider) => !provider.hasPassword);

    return {
      user,
      providers,
      permissions: {
        canEditName: true,
        canEditEmail: !hasSocialProvider,
        canEditImage: true,
        canChangePassword: false,
      },
      readOnlyReasons: {
        email: hasSocialProvider ? SOCIAL_EMAIL_READ_ONLY_REASON : null,
        password: hasSocialProvider ? SOCIAL_PASSWORD_READ_ONLY_REASON : LOCAL_PASSWORD_READ_ONLY_REASON,
      },
      credits: {
        remaining: credits.remainingCredits,
        dailyLimit: credits.dailyLimit,
      },
    };
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
