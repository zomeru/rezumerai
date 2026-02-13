import type { PrismaClient } from "@rezumerai/database";
import type { SessionUser } from "./model";

/**
 * Auth service — business logic for auth-related operations.
 * Receives Prisma via constructor injection from controller context.
 */
export class AuthService {
  constructor(readonly db: PrismaClient) {}

  /**
   * Returns the current session user profile.
   * Extend this to pull richer data beyond what the JWT/session carries.
   *
   * @param user - Authenticated session user from auth plugin
   * @returns Session user profile data
   */
  async getProfile(user: SessionUser): Promise<SessionUser> {
    // In a real app you'd query your User table:
    // return this.db.user.findUniqueOrThrow({ where: { id: user.id } });
    return user;
  }
}
