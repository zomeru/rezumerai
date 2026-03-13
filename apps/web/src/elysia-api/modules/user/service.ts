import type { PrismaClient, User } from "@rezumerai/database";
import type { UserAccountSettings } from "@rezumerai/types";
import { getPasswordManagementState, isCredentialProvider } from "@/lib/password-policy";
import { AiService } from "../ai/service";

const SOCIAL_EMAIL_READ_ONLY_REASON = "Email is managed by your social auth provider and cannot be updated here.";
const SOCIAL_PASSWORD_READ_ONLY_REASON = "This account is connected to an OAuth provider.";
type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;

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
  static async findAll(db: DatabaseClient): Promise<User[]> {
    return db.user.findMany();
  }

  /**
   * Finds a user by their unique identifier.
   *
   * @param db - Prisma client instance
   * @param id - User ID to look up
   * @returns User record if found, null otherwise
   */
  static async findById(db: DatabaseClient, id: string): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  }

  /**
   * Finds a user by their email address.
   *
   * @param db - Prisma client instance
   * @param email - User email to look up
   * @returns User record if found, null otherwise
   */
  static async findByEmail(db: DatabaseClient, email: string): Promise<User | null> {
    return db.user.findUnique({ where: { email } });
  }

  static async create(
    db: DatabaseClient,
    data: Pick<User, "name" | "email" | "role" | "image" | "isAnonymous" | "emailVerified">,
  ): Promise<User> {
    const now = new Date();

    return db.user.create({
      data: {
        id: globalThis.crypto.randomUUID(),
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified,
        role: data.role,
        image: data.image,
        isAnonymous: data.isAnonymous,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  /**
   * Updates a user's information.
   *
   * @param db - Prisma client instance
   * @param id - User ID to update
   * @param data - Partial user data to update (e.g. name, email)
   * @returns The updated user record, or null if the user does not exist
   */
  static async update(db: DatabaseClient, id: string, data: Partial<User>): Promise<User | null> {
    const exists = await db.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return null;
    return db.user.update({ where: { id }, data });
  }

  static async remove(db: DatabaseClient, id: string): Promise<User | null> {
    const exists = await db.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) return null;

    return db.user.delete({ where: { id } });
  }

  static async getAccountSettings(
    db: TransactionCapableDatabaseClient,
    userId: string,
  ): Promise<UserAccountSettings | null> {
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
      hasPassword: account.password !== null || isCredentialProvider(account.providerId),
    }));

    const hasSocialProvider = providers.some((provider) => !isCredentialProvider(provider.providerId));
    const hasCredentialProvider = providers.some((provider) => isCredentialProvider(provider.providerId));
    const isOAuthOnly = hasSocialProvider && !hasCredentialProvider;
    const passwordManagement = getPasswordManagementState({
      hasCredentialProvider,
      isOAuthOnly,
      lastPasswordChangeAt: user.lastPasswordChangeAt,
    });

    return {
      user,
      providers,
      permissions: {
        canEditName: true,
        canEditEmail: !hasSocialProvider,
        canEditImage: true,
        canChangePassword: hasCredentialProvider,
      },
      readOnlyReasons: {
        email: hasSocialProvider ? SOCIAL_EMAIL_READ_ONLY_REASON : null,
        password: isOAuthOnly ? SOCIAL_PASSWORD_READ_ONLY_REASON : null,
      },
      passwordManagement,
      credits: {
        remaining: credits.remainingCredits,
        dailyLimit: credits.dailyLimit,
      },
    };
  }
}
