import { z } from "zod";

// ── Auth models ──────────────────────────────────────────────────────────────

// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: SessionUserSchema.optional(),
  error: z.string().optional(),
});
