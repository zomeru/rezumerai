import type { PrismaClient } from "@rezumerai/database";
import type { SessionUser } from "./model";

/**
 * Auth service — business logic for auth-related operations.
 * Receives Prisma via parameter (injected from controller context).
 */
export class AuthService {
  constructor(readonly db: PrismaClient) {}

  /**
   * Return the current session user profile from the database.
   * Extend this to pull richer data beyond what the JWT/session carries.
   */
  async getProfile(user: SessionUser): Promise<SessionUser> {
    // In a real app you'd query your User table:
    // return this.db.user.findUniqueOrThrow({ where: { id: user.id } });
    return user;
  }
}
