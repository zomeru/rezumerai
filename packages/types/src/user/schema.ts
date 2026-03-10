import z from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;
export const PASSWORD_CHANGE_COOLDOWN_DAYS = 30;

export const PasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`);

export const PasswordConfirmationSchema = z.string().min(1, "Please confirm your password.");

export const UserRoleSchema = z.enum(["ADMIN", "USER"]);

export const SessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  isAnonymous: z.boolean().default(false),
  image: z.url().nullable(),
  role: UserRoleSchema.default("USER"),
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
  isAnonymous: z.boolean().default(false),
  image: z.url().nullable(),
  lastPasswordChangeAt: z.date().nullable(),
  role: UserRoleSchema,
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.date().nullable(),
  selectedAiModelId: z.string().nullable(),
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

export const UserPasswordManagementSchema = z.object({
  hasCredentialProvider: z.boolean(),
  isOAuthOnly: z.boolean(),
  isCooldownActive: z.boolean(),
  lastChangedAt: z.string().datetime().nullable(),
  nextAllowedAt: z.string().datetime().nullable(),
  cooldownMessage: z.string().nullable(),
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
  passwordManagement: UserPasswordManagementSchema,
  credits: UserAiCreditsSchema,
});

export type UpdateUserAccountInput = z.infer<typeof UpdateUserAccountSchema>;
export type UserAccountSettings = z.infer<typeof UserAccountSettingsSchema>;

export const PasswordChangeInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    password: PasswordSchema,
    confirmPassword: PasswordConfirmationSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

export type PasswordChangeInput = z.infer<typeof PasswordChangeInputSchema>;

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
