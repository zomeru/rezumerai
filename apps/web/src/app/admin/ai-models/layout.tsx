import type { ReactNode } from "react";
import AiModelsLayout from "@/components/Admin/AiModelsLayout";

interface AdminAiModelsRouteLayoutProps {
  children: ReactNode;
}

export default function AdminAiModelsRouteLayout({ children }: AdminAiModelsRouteLayoutProps) {
  return <AiModelsLayout>{children}</AiModelsLayout>;
}
