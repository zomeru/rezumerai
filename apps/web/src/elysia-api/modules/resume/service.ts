import type { PrismaClient } from "@rezumerai/database";
import type {
  EducationInputUpdate,
  ExperienceInputUpdate,
  FullResumeInputCreate,
  PersonalInfoInputUpdate,
  ProjectInputUpdate,
  ResumeInputUpdate,
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
  static async findAll(
    db: PrismaClient,
    userId: string,
  ): Promise<ResumeWithRelations[]> {
    const resumes = await db.resume.findMany({
      where: { userId },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
        user: true,
      },
    });
    return resumes;
  }

  static async create(
    db: PrismaClient,
    userId: string,
    data: FullResumeInputCreate,
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
        user: true,
      },
    });

    return newResume;
  }

  // Updates Resume table only
  static async updateResume(
    db: PrismaClient,
    userId: string,
    data: ResumeInputUpdate,
  ) {
    const { id, ...updateData } = data;

    try {
      return await db.resume.update({
        where: {
          id,
          userId,
        },
        data: {
          ...updateData,
          project: {},
        },
        include: {
          education: true,
          experience: true,
          project: true,
          personalInfo: true,
          user: true,
        },
      });
    } catch {
      throw new Error("Resume not found or does not belong to user");
    }
  }

  // Update personal info, experience, education, and project tables by resumeId
  static async updateResumeRelations(
    db: PrismaClient,
    userId: string,
    resumeId: string,
    data: {
      personalInfo?: PersonalInfoInputUpdate;
      experience?: ExperienceInputUpdate[];
      education?: EducationInputUpdate[];
      project?: ProjectInputUpdate[];
    },
  ) {
    const { personalInfo, experience, education, project } = data;

    // Update personal info, then
    // Update or Create experience, education, and project entries based on presence of id in input

    try {
      if (personalInfo) {
        await db.personalInformation.upsert({
          where: { resumeId },
          update: personalInfo,
          create: { ...personalInfo, resumeId },
        });
      }

      if (experience) {
        for (const item of experience) {
          const { id, resumeId, ...rest } = item;
          if (id) {
            await db.experience.update({
              where: { id },
              data: rest,
            });
          } else {
            await db.experience.create({
              // data: { ...rest, resumeId },
              data: { ...rest, resume: { connect: { id: resumeId } } },
            });
          }
        }
      }
    } catch (error) {
      throw new Error("Failed to update personal information");
    }
  }
}
