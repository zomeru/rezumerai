import type { Prisma, PrismaClient } from "@rezumerai/database";
import type { ResumeWithRelations } from "@rezumerai/types";
import { t } from "elysia";
import { CustomResumeWithRelationsInputUpdate } from "./model";
import type { ResumeCreateInput, ResumeSearchInput, ResumeUpdateInput, SyncPromiseReturn } from "./types";

const SyncEducation = t.Pick(CustomResumeWithRelationsInputUpdate, ["education"]);
type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;
const SyncExperience = t.Pick(CustomResumeWithRelationsInputUpdate, ["experience"]);
const SyncProject = t.Pick(CustomResumeWithRelationsInputUpdate, ["project"]);

type SyncItemsType =
  | typeof SyncEducation.static.education
  | typeof SyncExperience.static.experience
  | typeof SyncProject.static.project;

type SyncableRelation = {
  findMany(args: { where: { resumeId: string }; select: { id: true } }): Promise<{ id: string }[]>;
  deleteMany(args: { where: { id: { in: string[] } } }): SyncPromiseReturn;
  update(args: { where: { id: string }; data: Record<string, unknown> }): SyncPromiseReturn;
  create(args: { data: Record<string, unknown> }): SyncPromiseReturn;
};

// biome-ignore lint/complexity/noStaticOnlyClass: The repository intentionally groups stateless Prisma helpers for the resume module.
export abstract class ResumeRepository {
  static async search(db: DatabaseClient, userId: string, query: ResumeSearchInput): Promise<ResumeWithRelations[]> {
    const where: Prisma.ResumeWhereInput = {
      userId,
    };

    if (query.search?.trim()) {
      where.AND = [{ title: { contains: query.search.trim(), mode: "insensitive" } }];
    }

    return db.resume.findMany({
      where,
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  static async findById(db: DatabaseClient, userId: string, resumeId: string): Promise<ResumeWithRelations | null> {
    return db.resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
    });
  }

  static async create(db: DatabaseClient, userId: string, data: ResumeCreateInput): Promise<ResumeWithRelations> {
    const { personalInfo, project, experience, education, ...rest } = data;

    return db.resume.create({
      data: {
        user: {
          connect: { id: userId },
        },
        ...rest,
        personalInfo: {
          create: personalInfo,
        },
        experience: {
          create: experience,
        },
        education: {
          create: education,
        },
        project: {
          create: project,
        },
      },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
    });
  }

  static async update(
    db: TransactionCapableDatabaseClient,
    resumeId: string,
    data: ResumeUpdateInput,
  ): Promise<ResumeWithRelations> {
    const { education, experience, project, personalInfo, ...scalarFields } = data;

    return db.$transaction(async (tx) => {
      const updateOps: Prisma.PrismaPromise<unknown>[] = [];

      if (Object.keys(scalarFields).length > 0) {
        updateOps.push(
          tx.resume.update({
            where: { id: resumeId },
            data: scalarFields,
          }),
        );
      }

      if (personalInfo) {
        updateOps.push(
          tx.personalInformation.upsert({
            where: { resumeId },
            update: personalInfo,
            create: { ...personalInfo, resumeId },
          }),
        );
      }

      const [experienceOps, educationOps, projectOps] = await Promise.all([
        ResumeRepository.syncRelation(tx.experience as unknown as SyncableRelation, resumeId, experience),
        ResumeRepository.syncRelation(tx.education as unknown as SyncableRelation, resumeId, education),
        ResumeRepository.syncRelation(tx.project as unknown as SyncableRelation, resumeId, project),
      ]);

      updateOps.push(...experienceOps, ...educationOps, ...projectOps);
      await Promise.all(updateOps);

      return tx.resume.findUniqueOrThrow({
        where: { id: resumeId },
        include: {
          education: true,
          experience: true,
          project: true,
          personalInfo: true,
        },
      });
    });
  }

  static async delete(db: DatabaseClient, userId: string, resumeId: string): Promise<boolean> {
    const result = await db.resume.deleteMany({
      where: {
        id: resumeId,
        user: {
          id: userId,
        },
      },
    });

    return result.count > 0;
  }

  static async exists(db: DatabaseClient, userId: string, resumeId: string): Promise<boolean> {
    const existing = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });

    return Boolean(existing);
  }

  private static async syncRelation(
    relation: SyncableRelation,
    resumeId: string,
    items: SyncItemsType,
  ): Promise<SyncPromiseReturn[]> {
    if (!items) {
      return [];
    }

    const existing = await relation.findMany({
      where: { resumeId },
      select: { id: true },
    });

    const existingIds = existing.map((entry) => entry.id);
    const itemIds = items.map((item) => item.id).filter((id): id is string => Boolean(id));
    const toDelete = existingIds.filter((id) => !itemIds.includes(id));

    if (toDelete.length > 0) {
      await relation.deleteMany({ where: { id: { in: toDelete } } });
    }

    const createOrUpdateOps: SyncPromiseReturn[] = [];

    for (const item of items) {
      const { id, ...rest } = item;

      if (id && existingIds.includes(id)) {
        createOrUpdateOps.push(
          relation.update({
            where: { id },
            data: rest,
          }),
        );
      } else {
        createOrUpdateOps.push(
          relation.create({
            data: { ...rest, resumeId },
          }),
        );
      }
    }

    return createOrUpdateOps;
  }
}
