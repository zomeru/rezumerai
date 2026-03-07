import { notFound } from "next/navigation";
import ErrorDetailPageClient from "@/components/Admin/ErrorDetailPageClient";

interface AdminErrorDetailPageProps {
  params: Promise<{
    errorId: string;
  }>;
}

export default async function AdminErrorDetailPage({ params }: AdminErrorDetailPageProps): Promise<React.JSX.Element> {
  const { errorId } = await params;

  if (!errorId) {
    notFound();
  }

  return <ErrorDetailPageClient errorId={errorId} />;
}
