import type { Prisma } from "@rezumerai/database";
import type { ResumeWithRelations, ResumeWithRelationsInputUpdate } from "@rezumerai/types";

export type ResumeSearchInput = {
  search?: string;
};

export type ResumeCreateInput = import("./model").ResumeCreateInput;
export type ResumeUpdateInput = ResumeWithRelationsInputUpdate;
export type ResumeRecord = ResumeWithRelations;

export type SyncPromiseReturn = Prisma.PrismaPromise<unknown>;
