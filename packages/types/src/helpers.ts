export type Unwrap<T> = T extends null | undefined ? never : T;
export type Element<T> = T extends (infer U)[] ? U : never;

export type StripAudit<T> = Omit<
  T,
  "id" | "resumeId" | "userId" | "createdAt" | "updatedAt"
>;
