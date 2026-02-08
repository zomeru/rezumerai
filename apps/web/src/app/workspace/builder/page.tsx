import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routing";

export default function BuilderPage(): never {
  redirect(ROUTES.WORKSPACE);
}
