import { describe, expect, it, mock } from "bun:test";
import type { PrismaClient } from "@rezumerai/database";
import { ResumeService } from "../service";

const RESUME_ID = "resume_123";
const USER_ID = "user_456";

const RESUME_WITH_RELATIONS = {
  id: RESUME_ID,
  userId: USER_ID,
  title: "My Resume",
  public: false,
  professionalSummary: "",
  template: "classic" as const,
  accentColor: "#000000",
  fontSize: "medium" as const,
  customFontSize: 1,
  skills: [] as string[],
  createdAt: new Date(),
  updatedAt: new Date(),
  personalInfo: null,
  experience: [],
  education: [],
  project: [],
};

function makeMockDb(): PrismaClient {
  return {
    resume: {
      findFirst: mock(),
      findMany: mock(),
      update: mock(),
      create: mock(),
      deleteMany: mock(),
    },
    personalInformation: { upsert: mock() },
    experience: {
      findMany: mock(),
      update: mock(),
      create: mock(),
      deleteMany: mock(),
    },
    education: {
      findMany: mock(),
      update: mock(),
      create: mock(),
      deleteMany: mock(),
    },
    project: {
      findMany: mock(),
      update: mock(),
      create: mock(),
      deleteMany: mock(),
    },
    $transaction: mock(),
  } as unknown as PrismaClient;
}

describe("ResumeService.findById", () => {
  it("returns the resume when found and owned by user", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue(RESUME_WITH_RELATIONS);

    const result = await ResumeService.findById(db, USER_ID, RESUME_ID);

    expect(result).toEqual(RESUME_WITH_RELATIONS);
    expect(db.resume.findFirst).toHaveBeenCalledWith({
      where: { id: RESUME_ID, userId: USER_ID },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
    });
  });

  it("returns null when resume not found", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue(null);

    const result = await ResumeService.findById(db, USER_ID, RESUME_ID);

    expect(result).toBeNull();
  });
});

describe("ResumeService.update", () => {
  it("returns null when resume not found or not owned", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue(null);

    const result = await ResumeService.update(db, USER_ID, RESUME_ID, {
      title: "New Title",
    });

    expect(result).toBeNull();
  });

  it("returns updated resume when ownership check passes", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue({
      id: RESUME_ID,
    });

    const updatedResume = { ...RESUME_WITH_RELATIONS, title: "New Title" };

    (db.$transaction as ReturnType<typeof mock>).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        resume: {
          update: mock().mockResolvedValue(undefined),
          findUniqueOrThrow: mock().mockResolvedValue(updatedResume),
        },
        personalInformation: { upsert: mock() },
        experience: {
          findMany: mock().mockResolvedValue([]),
          update: mock(),
          create: mock(),
          deleteMany: mock(),
        },
        education: {
          findMany: mock().mockResolvedValue([]),
          update: mock(),
          create: mock(),
          deleteMany: mock(),
        },
        project: {
          findMany: mock().mockResolvedValue([]),
          update: mock(),
          create: mock(),
          deleteMany: mock(),
        },
      };
      return fn(tx);
    });

    const result = await ResumeService.update(db, USER_ID, RESUME_ID, {
      title: "New Title",
    });

    expect(result).toEqual(updatedResume);
  });
});

describe("ResumeService.deleteResume", () => {
  it("returns true when resume is found and deleted", async () => {
    const db = makeMockDb();
    (db.resume.deleteMany as ReturnType<typeof mock>).mockResolvedValue({
      count: 1,
    });

    const result = await ResumeService.deleteResume(db, USER_ID, RESUME_ID);

    expect(result).toBe(true);
    expect(db.resume.deleteMany).toHaveBeenCalledWith({
      where: { id: RESUME_ID, userId: USER_ID },
    });
  });

  it("returns false when resume is not found or not owned", async () => {
    const db = makeMockDb();
    (db.resume.deleteMany as ReturnType<typeof mock>).mockResolvedValue({
      count: 0,
    });

    const result = await ResumeService.deleteResume(db, USER_ID, RESUME_ID);

    expect(result).toBe(false);
  });
});
