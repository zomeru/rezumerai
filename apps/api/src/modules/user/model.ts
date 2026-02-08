import { z } from "zod";

// ── User models ──────────────────────────────────────────────────────────────

// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof UserSchema>;

// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const UserParamsSchema = z.object({
  id: z.string().min(1),
});
