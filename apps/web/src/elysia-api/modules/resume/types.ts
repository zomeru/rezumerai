import type { Prisma } from "@rezumerai/database";
import type { ResumeWithRelations } from "@rezumerai/types";
import type { CustomResumeWithRelationsInputCreate, CustomResumeWithRelationsInputUpdate } from "./model";

export type ResumeSearchInput = {
  search?: string;
};

export type ResumeCreateInput = typeof CustomResumeWithRelationsInputCreate.static;
export type ResumeUpdateInput = typeof CustomResumeWithRelationsInputUpdate.static;
export type ResumeRecord = ResumeWithRelations;

export type SyncPromiseReturn = Prisma.PrismaPromise<unknown>;
