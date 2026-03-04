export type Unwrap<T> = T extends null | undefined ? never : T;
export type Element<T> = T extends (infer U)[] ? U : never;

export type StripAudit<T> = Omit<T, "id" | "resumeId" | "userId" | "createdAt" | "updatedAt">;

// export type DeepPartial<T> = {
//   [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
// };

type Builtin = Date | RegExp | Error | Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any>;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;
