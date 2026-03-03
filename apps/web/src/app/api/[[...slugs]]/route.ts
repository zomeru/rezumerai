import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";
import { elysiaApp } from "@/elysia-api/app";

const compiledApp = elysiaApp.compile();

async function withBotId(request: Request) {
  const verification = await checkBotId({
    developmentOptions: {
      bypass: "HUMAN", // enables bot detection in development for testing purposes.
    },
  });

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Forward to Elysia
  return compiledApp.handle(request);
}

export const GET = withBotId;
export const POST = withBotId;
export const PUT = withBotId;
export const PATCH = withBotId;
export const DELETE = withBotId;
