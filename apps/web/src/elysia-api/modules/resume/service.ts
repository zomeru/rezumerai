import type { Prisma, PrismaClient } from "@rezumerai/database";
import type { ResumeWithRelations } from "@rezumerai/types";
import { t } from "elysia";
import { type CustomResumeInputCreate, CustomResumeWithRelationInputUpdate } from "./model";

type SyncPromiseReturn = Prisma.PrismaPromise<unknown>;

const SyncEducation = t.Pick(CustomResumeWithRelationInputUpdate, ["education"]);
const SyncExperience = t.Pick(CustomResumeWithRelationInputUpdate, ["experience"]);
const SyncProject = t.Pick(CustomResumeWithRelationInputUpdate, ["project"]);

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

// biome-ignore lint/complexity/noStaticOnlyClass: Pattern is intentional for service classes with only static methods.
export abstract class ResumeService {
  /**
   * Retrieves all resumes for a given user.
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

  static async create(
    db: PrismaClient,
    userId: string,
    data: typeof CustomResumeInputCreate.static,
  ): Promise<ResumeWithRelations> {
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
   */
  static async update(
    db: PrismaClient,
    userId: string,
    resumeId: string,
    data: typeof CustomResumeWithRelationInputUpdate.static,
  ): Promise<ResumeWithRelations | null> {
    const existing = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });
    if (!existing) return null;

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
        ResumeService._syncRelation(tx.experience as unknown as SyncableRelation, resumeId, experience),
        ResumeService._syncRelation(tx.education as unknown as SyncableRelation, resumeId, education),
        ResumeService._syncRelation(tx.project as unknown as SyncableRelation, resumeId, project),
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
    console.log("Attempting to delete resume with ID:", {
      resumeId,
      userId,
    });
    const result = await db.resume.deleteMany({
      where: {
        id: resumeId,
        user: {
          id: userId,
        },
      },
    });
    // console.log("Delete result:", result);
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
    items: SyncItemsType,
  ): Promise<SyncPromiseReturn[]> {
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

    const createOrUpdateOps: SyncPromiseReturn[] = [];

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
