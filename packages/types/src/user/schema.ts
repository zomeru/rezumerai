import z from "zod";

export const SessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

export const GetUserByIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const GetUserByEmailParamsSchema = z.object({
  email: z.email(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UpdateUserAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email().optional(),
    image: z.url().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    error: "At least one field must be provided",
  });

export const UserAccountProviderSchema = z.object({
  providerId: z.string().min(1),
  hasPassword: z.boolean(),
});

export const UserAccountPermissionsSchema = z.object({
  canEditName: z.boolean(),
  canEditEmail: z.boolean(),
  canEditImage: z.boolean(),
  canChangePassword: z.boolean(),
});

export const UserAccountReadOnlyReasonsSchema = z.object({
  email: z.string().nullable(),
  password: z.string().nullable(),
});

export const UserAiCreditsSchema = z.object({
  remaining: z.number().int().min(0),
  dailyLimit: z.number().int().positive(),
});

export const UserAccountSettingsSchema = z.object({
  user: UserSchema,
  providers: z.array(UserAccountProviderSchema),
  permissions: UserAccountPermissionsSchema,
  readOnlyReasons: UserAccountReadOnlyReasonsSchema,
  credits: UserAiCreditsSchema,
});

export type UpdateUserAccountInput = z.infer<typeof UpdateUserAccountSchema>;
export type UserAccountSettings = z.infer<typeof UserAccountSettingsSchema>;

export const GetAccountByIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const GetAccountByUserIdParamsSchema = z.object({
  userId: z.string().min(1),
});

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  accessTokenExpiresAt: z.date().nullable(),
  refreshTokenExpiresAt: z.date().nullable(),
  scope: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetVerificationByIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const GetVerificationByIdentifierParamsSchema = z.object({
  identifier: z.string().min(1),
});

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
