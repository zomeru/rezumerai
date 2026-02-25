import type { PrismaClient } from "@rezumerai/database";
import type { FullResumeInputCreate, ResumeUpdateBody, ResumeWithRelations } from "@rezumerai/types";

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
        const existingExp = await tx.experience.findMany({
          where: { resumeId },
          select: { id: true },
        });
        const keepExpIds = experience.filter((i) => i.id).map((i) => i.id as string);
        const deleteExpIds = existingExp.map((e) => e.id).filter((id) => !keepExpIds.includes(id));
        if (deleteExpIds.length > 0) {
          await tx.experience.deleteMany({ where: { id: { in: deleteExpIds } } });
        }
        for (const item of experience) {
          const { id, ...rest } = item;
          if (id) {
            await tx.experience.update({ where: { id }, data: rest });
          } else {
            await tx.experience.create({ data: { ...rest, resumeId } });
          }
        }
      }

      if (education !== undefined) {
        const existingEdu = await tx.education.findMany({
          where: { resumeId },
          select: { id: true },
        });
        const keepEduIds = education.filter((i) => i.id).map((i) => i.id as string);
        const deleteEduIds = existingEdu.map((e) => e.id).filter((id) => !keepEduIds.includes(id));
        if (deleteEduIds.length > 0) {
          await tx.education.deleteMany({ where: { id: { in: deleteEduIds } } });
        }
        for (const item of education) {
          const { id, ...rest } = item;
          if (id) {
            await tx.education.update({ where: { id }, data: rest });
          } else {
            await tx.education.create({ data: { ...rest, resumeId } });
          }
        }
      }

      if (project !== undefined) {
        const existingProj = await tx.project.findMany({
          where: { resumeId },
          select: { id: true },
        });
        const keepProjIds = project.filter((i) => i.id).map((i) => i.id as string);
        const deleteProjIds = existingProj.map((e) => e.id).filter((id) => !keepProjIds.includes(id));
        if (deleteProjIds.length > 0) {
          await tx.project.deleteMany({ where: { id: { in: deleteProjIds } } });
        }
        for (const item of project) {
          const { id, ...rest } = item;
          if (id) {
            await tx.project.update({ where: { id }, data: rest });
          } else {
            await tx.project.create({ data: { ...rest, resumeId } });
          }
        }
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
}
