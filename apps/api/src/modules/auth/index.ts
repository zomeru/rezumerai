import Elysia from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { AuthService } from "./service";

/**
 * Auth module — protected routes that require a valid NextAuth session.
 */
// biome-ignore lint/nursery/useExplicitType: Elysia type inference required
export const authModule = new Elysia({ prefix: "/auth" })
  .use(prismaPlugin)
  .use(authPlugin)
  .get("/me", async ({ user, db }) => {
    const service = new AuthService(db);
    const profile = await service.getProfile(user);

    return {
      success: true,
      data: profile,
    };
  });
