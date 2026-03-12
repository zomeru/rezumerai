import { notFound } from "next/navigation";
import { getServerSessionIdentity } from "@/lib/server-runtime";

export async function requireAdminOrNotFound(): Promise<{ userId: string }> {
  const { userId, role } = await getServerSessionIdentity();

  if (!userId) {
    notFound();
  }

  if (role !== "ADMIN") {
    notFound();
  }

  return { userId };
}
