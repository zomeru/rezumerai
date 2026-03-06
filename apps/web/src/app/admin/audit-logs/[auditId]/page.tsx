import { notFound } from "next/navigation";
import AuditLogDetailPageClient from "./AuditLogDetailPageClient";

interface AdminAuditLogDetailPageProps {
  params: Promise<{
    auditId: string;
  }>;
}

export default async function AdminAuditLogDetailPage({
  params,
}: AdminAuditLogDetailPageProps): Promise<React.JSX.Element> {
  const { auditId } = await params;

  if (!auditId) {
    notFound();
  }

  return <AuditLogDetailPageClient auditId={auditId} />;
}
