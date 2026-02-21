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
