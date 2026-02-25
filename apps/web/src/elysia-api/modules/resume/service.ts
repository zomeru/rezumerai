import type { PrismaClient } from "@rezumerai/database";
import type {
  EducationUpdateItem,
  ExperienceUpdateItem,
  FullResumeInputCreate,
  ProjectUpdateItem,
  ResumeUpdateBody,
  ResumeWithRelations,
} from "@rezumerai/types";

/**
 * Resume service — business logic only, no HTTP concerns.
 * Uses abstract class (no allocation needed) with static methods receiving db via parameter.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Pattern is intentional for service classes with only static methods.
export abstract class ResumeService {
  /**
   * Retrieves all users.
   *
   * @param db - Prisma client instance
   * @param userId - ID of the user whose resumes to retrieve
   * @returns Array of all resumes for the specified user
   */
  static async findAll(db: PrismaClient, userId: string): Promise<ResumeWithRelations[]> {
    const resumes = await db.resume.findMany({
      where: { userId },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
    });
    return resumes;
  }

  /**
   * Finds a single resume by ID, scoped to the authenticated user.
   *
   * @param db - Prisma client instance
   * @param userId - ID of the authenticated user (ownership check)
   * @param resumeId - ID of the resume to retrieve
   * @returns Resume with all relations, or null if not found / not owned
   */
  static async findById(db: PrismaClient, userId: string, resumeId: string): Promise<ResumeWithRelations | null> {
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
    });
    return resume;
  }

  static async create(db: PrismaClient, userId: string, data: FullResumeInputCreate): Promise<ResumeWithRelations> {
    const { personalInfo, project, experience, education, ...rest } = data;
    const newResume = await db.resume.create({
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

    return newResume;
  }

  /**
   * Updates a resume's scalar fields and/or nested relation arrays in a single transaction.
   * For relation arrays: items with an id are updated; items without an id are created;
   * existing items not present in the input are deleted.
   *
   * @param db - Prisma client instance
   * @param userId - Authenticated user ID (ownership check)
   * @param resumeId - Resume to update
   * @param data - Partial scalar fields + optional relation arrays
   * @returns Updated resume with all relations, or null if not found / not owned
   */
  static async update(
    db: PrismaClient,
    userId: string,
    resumeId: string,
    data: ResumeUpdateBody,
  ): Promise<ResumeWithRelations | null> {
    const existing = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });
    if (!existing) return null;

    const { personalInfo, experience, education, project, ...scalarFields } = data;

    return db.$transaction(async (tx) => {
      if (Object.keys(scalarFields).length > 0) {
        await tx.resume.update({
          where: { id: resumeId },
          data: scalarFields,
        });
      }

      if (personalInfo !== undefined) {
        await tx.personalInformation.upsert({
          where: { resumeId },
          update: personalInfo,
          create: { ...personalInfo, resumeId },
        });
      }

      if (experience !== undefined) {
        await ResumeService._syncRelation(tx.experience, resumeId, experience);
      }

      if (education !== undefined) {
        await ResumeService._syncRelation(tx.education, resumeId, education);
      }

      if (project !== undefined) {
        await ResumeService._syncRelation(tx.project, resumeId, project);
      }

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

  /**
   * Syncs a relation array against DB: deletes removed, updates existing (by id), creates new (no id).
   */
  static async _syncRelation(
    relation: {
      findMany: (args: { where: { resumeId: string }; select: { id: true } }) => Promise<{ id: string }[]>;
      deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown>;
      update: (args: { where: { id: string }; data: unknown }) => Promise<unknown>;
      create: (args: { data: unknown }) => Promise<unknown>;
    },
    resumeId: string,
    items: Array<ExperienceUpdateItem | EducationUpdateItem | ProjectUpdateItem>,
  ): Promise<void> {
    const existing = await relation.findMany({
      where: { resumeId },
      select: { id: true },
    });
    const existingIds = existing.map((r) => r.id);
    const incomingIds = items.filter((i) => i.id).map((i) => i.id as string);
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    if (toDelete.length > 0) {
      await relation.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const item of items) {
      const { id, ...rest } = item;
      if (id) {
        await relation.update({ where: { id }, data: rest });
      } else {
        await relation.create({ data: { ...rest, resumeId } });
      }
    }
  }
}
