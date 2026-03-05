import Elysia, { t } from "elysia";

export const AiModel = new Elysia().model({
  "ai.OptimizeInput": t.Object({
    text: t.String({ minLength: 1, description: "Text to optimize" }),
    resumeId: t.Optional(t.String({ minLength: 1, description: "Optional source resume ID" })),
  }),
} as const);
