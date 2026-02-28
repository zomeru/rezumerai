import type { Prisma, PrismaClient } from "@rezumerai/database";
import type {
  EducationUpdateItem,
  ExperienceUpdateItem,
  FullResumeInputCreate,
  ProjectUpdateItem,
  ResumeWithRelations,
} from "@rezumerai/types";
import type { CustomResumeWithRelationInputUpdate } from "./model";

type SyncPromiseReturn = Prisma.PrismaPromise<unknown>;

/**
 * Minimal structural type that any Prisma relation delegate must satisfy
 * for the diff-sync helper. Cast the concrete delegate at the call site.
 */
type SyncableRelation = {
  findMany(args: { where: { resumeId: string }; select: { id: true } }): Promise<{ id: string }[]>;
  deleteMany(args: { where: { id: { in: string[] } } }): SyncPromiseReturn;
  update(args: { where: { id: string }; data: Record<string, unknown> }): SyncPromiseReturn;
  create(args: { data: Record<string, unknown> }): SyncPromiseReturn;
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
  static async findMany(db: PrismaClient, userId: string): Promise<ResumeWithRelations[]> {
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
    data: typeof CustomResumeWithRelationInputUpdate.static,
  ): Promise<ResumeWithRelations | null> {
    // ownership check
    const existing = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });
    if (!existing) return null;

    const { education, experience, project, personalInfo, ...scalarFields } = data;

    return db.$transaction(async (tx) => {
      // 1. Update scalar fields if any
      const updateOps: Prisma.PrismaPromise<unknown>[] = [];
      if (Object.keys(scalarFields).length > 0) {
        updateOps.push(
          tx.resume.update({
            where: { id: resumeId },
            data: scalarFields,
          }),
        );
      }

      // 2. Upsert personal info
      if (personalInfo) {
        updateOps.push(
          tx.personalInformation.upsert({
            where: { resumeId },
            update: personalInfo,
            create: { ...personalInfo, resumeId },
          }),
        );
      }

      // 3. Sync relation arrays in parallel
      const [experienceOps, educationOps, projectOps] = await Promise.all([
        ResumeService._syncRelation(tx.experience as unknown as SyncableRelation, resumeId, experience),
        ResumeService._syncRelation(tx.education as unknown as SyncableRelation, resumeId, education),
        ResumeService._syncRelation(tx.project as unknown as SyncableRelation, resumeId, project),
      ]);
      updateOps.push(...experienceOps, ...educationOps, ...projectOps);

      // 4. Execute all updates
      await Promise.all(updateOps);

      // 5. Return updated resume
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
  static async delete(db: PrismaClient, userId: string, resumeId: string): Promise<boolean> {
    const result = await db.resume.delete({
      where: { id: resumeId, userId },
    });
    return !!result;
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
  ): Promise<Prisma.PrismaPromise<unknown>[]> {
    if (!items) return [];

    const existing = await relation.findMany({
      where: { resumeId },
      select: { id: true },
    });

    // ids from items not present in existing = to create; ids from existing not present in items = to delete; ids in both = to update
    const existingIds = existing.map((e) => e.id);
    const itemIds = items.map((i) => i.id).filter((id): id is string => !!id);

    const toDelete = existingIds.filter((id) => !itemIds.includes(id));
    if (toDelete.length > 0) {
      await relation.deleteMany({ where: { id: { in: toDelete } } });
    }

    const createOrUpdateOps: Prisma.PrismaPromise<unknown>[] = [];

    items.forEach((item) => {
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
    });

    return createOrUpdateOps;
  }
}
