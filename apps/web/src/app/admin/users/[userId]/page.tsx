import { notFound } from "next/navigation";
import UserDetailPageClient from "@/components/Admin/UserDetailPageClient";

interface AdminUserDetailPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps): Promise<React.JSX.Element> {
  const { userId } = await params;

  if (!userId) {
    notFound();
  }

  return <UserDetailPageClient userId={userId} />;
}
