import type { PrismaClient } from "@rezumerai/database";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;

import type { ResumeWithRelations } from "@rezumerai/types";
import { ResumeRepository } from "./repository";
import type { ResumeCreateInput, ResumeSearchInput, ResumeUpdateInput } from "./types";

// biome-ignore lint/complexity/noStaticOnlyClass: The service remains a stable facade while the repository owns Prisma queries.
export abstract class ResumeService {
  static async search(db: DatabaseClient, userId: string, query: ResumeSearchInput): Promise<ResumeWithRelations[]> {
    return ResumeRepository.search(db, userId, query);
  }

  static async findById(db: DatabaseClient, userId: string, resumeId: string): Promise<ResumeWithRelations | null> {
    return ResumeRepository.findById(db, userId, resumeId);
  }

  static async create(db: DatabaseClient, userId: string, data: ResumeCreateInput): Promise<ResumeWithRelations> {
    return ResumeRepository.create(db, userId, data);
  }

  static async update(
    db: TransactionCapableDatabaseClient,
    userId: string,
    resumeId: string,
    data: ResumeUpdateInput,
  ): Promise<ResumeWithRelations | null> {
    const exists = await ResumeRepository.exists(db, userId, resumeId);

    if (!exists) {
      return null;
    }

    return ResumeRepository.update(db, resumeId, data);
  }

  static async delete(db: DatabaseClient, userId: string, resumeId: string): Promise<boolean> {
    return ResumeRepository.delete(db, userId, resumeId);
  }
}
