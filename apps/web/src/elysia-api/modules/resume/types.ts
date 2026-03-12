import type { Prisma } from "@rezumerai/database";
import type { ResumeListItem, ResumeWithRelations, ResumeWithRelationsInputUpdate } from "@rezumerai/types";

export type ResumeSearchInput = {
  search?: string;
};

export type ResumeCreateInput = import("./model").ResumeCreateInput;
export type ResumeUpdateInput = ResumeWithRelationsInputUpdate;
export type ResumeRecord = ResumeWithRelations;
export type ResumeListRecord = ResumeListItem;

export type SyncPromiseReturn = Prisma.PrismaPromise<unknown>;
