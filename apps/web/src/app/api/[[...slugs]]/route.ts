import { checkBotId } from "botid/server";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { elysiaApp } from "@/elysia-api/app";

const isBotIdEnabled = process.env.BOTID_ENABLED === "true";

async function withBotId(request: Request) {
  if (!isBotIdEnabled) {
    return elysiaApp.fetch(request);
  }

  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Forward to Elysia
  return elysiaApp.fetch(request);
}

export const GET = withBotId;
export const POST = withBotId;
export const PUT = withBotId;
export const PATCH = withBotId;
export const DELETE = withBotId;
