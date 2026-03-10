import { prisma } from "@rezumerai/database";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireAdminOrNotFound(): Promise<{ userId: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    notFound();
  }

  return { userId };
}
