import type { PrismaClient } from "@rezumerai/database";
import type { UserAccountSettings } from "@rezumerai/types";
import { getPasswordManagementState, isCredentialProvider } from "@/lib/password-policy";
import { AiService } from "../ai/service";

const SOCIAL_EMAIL_READ_ONLY_REASON = "Email is managed by your social auth provider and cannot be updated here.";
const SOCIAL_PASSWORD_READ_ONLY_REASON = "This account is connected to an OAuth provider.";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;

export const ProfileService = {
  async getAccountSettings(db: TransactionCapableDatabaseClient, userId: string): Promise<UserAccountSettings | null> {
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
  },

  async updateOwnProfile(
    db: DatabaseClient,
    userId: string,
    updates: { name?: string; email?: string; image?: string | null },
  ) {
    const exists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!exists) return null;

    return db.user.update({
      where: { id: userId },
      data: updates,
    });
  },
};
