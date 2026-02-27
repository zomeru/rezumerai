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
 * Minimal structural type that any Prisma relation delegate must satisfy
 * for the diff-sync helper. Cast the concrete delegate at the call site.
 */
type SyncableRelation = {
  findMany(args: { where: { resumeId: string }; select: { id: true } }): Promise<{ id: string }[]>;
  deleteMany(args: { where: { id: { in: string[] } } }): Promise<unknown>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
};

/**
 * Resume service — business logic only, no HTTP concerns.
 * Uses abstract class (no allocation needed) with static methods receiving db via parameter.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Pattern is intentional for service classes with only static methods.
export abstract class ResumeService {
  /**
   * Retrieves all resumes for a given user.
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

      if (personalInfo !== undefined && personalInfo !== null) {
        await tx.personalInformation.upsert({
          where: { resumeId },
          update: personalInfo,
          create: { ...personalInfo, resumeId },
        });
      }

      if (experience) {
        await ResumeService._syncRelation(tx.experience as unknown as SyncableRelation, resumeId, experience);
      }

      if (education) {
        await ResumeService._syncRelation(tx.education as unknown as SyncableRelation, resumeId, education);
      }

      if (project) {
        await ResumeService._syncRelation(tx.project as unknown as SyncableRelation, resumeId, project);
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
   * Deletes a resume owned by the specified user.
   * Prisma cascades the delete to all related tables.
   *
   * @param db - Prisma client instance
   * @param userId - Authenticated user ID (ownership check)
   * @param resumeId - Resume to delete
   * @returns true if deleted, false if not found or not owned
   */
  static async deleteResume(db: PrismaClient, userId: string, resumeId: string): Promise<boolean> {
    const result = await db.resume.deleteMany({
      where: { id: resumeId, userId },
    });
    return result.count > 0;
  }

  /**
   * Syncs a relation array against the database:
   * - Deletes records not present in `items`
   * - Updates records that have an `id`
   * - Creates records that have no `id`
   *
   * @param relation - Prisma delegate cast to SyncableRelation
   * @param resumeId - Resume ID used as the foreign key for new records
   * @param items - Incoming items; id present = update, id absent = create
   */
  private static async _syncRelation(
    relation: SyncableRelation,
    resumeId: string,
    items: Array<ExperienceUpdateItem | EducationUpdateItem | ProjectUpdateItem>,
  ): Promise<void> {
    const existing = await relation.findMany({
      where: { resumeId },
      select: { id: true },
    });

    // ids from items not present in existing = to create; ids from existing not present in items = to delete; ids in both = to update
    const itemIds = items.map((i) => i.id).filter((id): id is string => !!id);
    const existingIds = existing.map((e) => e.id);
    const toDelete = existingIds.filter((id) => !itemIds.includes(id));

    // // const keepIds = items.filter((i) => i.id).map((i) => i.id as string);
    // // const toDelete = existing.map((e) => e.id).filter((id) => !keepIds.includes(id));

    if (toDelete.length > 0) {
      await relation.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const item of items) {
      const { id, ...rest } = item;
      // id is always present, but not created ones is generated from the client, so check if id exists in the existing records to determine whether to update or create
      const exists = existingIds.includes(id as string);
      if (exists) {
        await relation.update({
          where: { id: id as string },
          data: rest as Record<string, unknown>,
        });
      } else {
        await relation.create({
          data: { ...rest, resumeId } as Record<string, unknown>,
        });
      }

      // if (id) {
      //   await relation.update({
      //     where: { id },
      //     data: rest as Record<string, unknown>,
      //   });
      // } else {
      //   await relation.create({
      //     data: { ...rest, resumeId } as Record<string, unknown>,
      //   });
      // }
    }
  }
}
