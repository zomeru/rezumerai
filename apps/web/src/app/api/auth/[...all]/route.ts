import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

type NextJsHandler = ReturnType<typeof toNextJsHandler>;
export const { GET, POST }: NextJsHandler = toNextJsHandler(auth);
