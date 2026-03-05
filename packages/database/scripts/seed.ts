import { type Prisma, prisma } from "../";
import { generateDummyData } from "../dummy-data/resumes";

async function clearDatabase(): Promise<void> {
  console.log("🗑️  Clearing existing data...");

  await prisma.$connect();

  await prisma.$transaction([
    prisma.project.deleteMany(),
    prisma.education.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.resume.deleteMany(),
  ]);

  console.log("✅ Existing data cleared");
}

async function seedResumes(): Promise<void> {
  console.log("📝 Creating resumes...");

  const userEmail = process.env.DB_SEED_USER_EMAIL;

  if (!userEmail) {
    throw new Error("❌ DB_SEED_USER_EMAIL environment variable is not set");
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error(`❌ User with email ${userEmail} not found`);
  }

  const dummyResumeData = generateDummyData(user.id);

  const operations = dummyResumeData.map((resumeData: Prisma.ResumeCreateInput) =>
    prisma.resume.create({ data: resumeData }),
  );

  const results = await prisma.$transaction(operations);

  results.forEach((resume) => {
    console.log(`  ✓ Created resume: ${resume.title} (${resume.id})`);
  });

  console.log(`\n✨ Successfully seeded ${results.length} resumes`);
}

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  // 🚨 Safety check — never nuke prod by accident
  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ Seeding is disabled in production");
  }

  await clearDatabase();
  await seedResumes();
}

main()
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
