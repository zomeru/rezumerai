// Redirects bare /workspace/builder to the workspace dashboard.
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routing";

export default function BuilderPage(): never {
  redirect(ROUTES.WORKSPACE);
}
