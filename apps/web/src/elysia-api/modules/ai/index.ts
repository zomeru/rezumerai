import type {
  AssistantChatResponse,
  ResumeCopilotOptimizeResponse,
  ResumeCopilotReviewResponse,
  ResumeCopilotTailorResponse,
} from "@rezumerai/types";
import Elysia, { t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { AI_CREDITS_EXHAUSTED_CODE, AI_MODEL_POLICY_RESTRICTED_CODE, AI_MODEL_UNAVAILABLE_CODE } from "./constants";
import {
  handleAssistantChatRequest,
  handleCopilotOptimizeRequest,
  handleCopilotReviewRequest,
  handleCopilotTailorRequest,
  handleGetSettingsRequest,
  handleListModelsRequest,
  handleOptimizeTextRequest,
  handleUpdateSelectedModelRequest,
} from "./controller";
import { AiModel } from "./model";
import type { ActiveAiModel, UserAiSettings } from "./service";

function applyResponseHeaders(
  target: Record<string, string | number | undefined>,
  headers?: Record<string, string>,
): void {
  if (!headers) {
    return;
  }

  for (const [name, value] of Object.entries(headers)) {
    target[name] = value;
  }
}

export const aiModule = new Elysia({ name: "module/ai", prefix: "/ai" })
  .use(prismaPlugin)
  .use(AiModel)
  .post(
    "/assistant/chat",
    async ({ body, db, status, request, set }) => {
      const response = await handleAssistantChatRequest({
        body,
        db,
        request,
      });

      applyResponseHeaders(set.headers, response.headers);

      return response.status === 200
        ? status(200, response.body as AssistantChatResponse)
        : status(422, response.body as AssistantChatResponse);
    },
    {
      body: "ai.AssistantChatInput",
      response: {
        200: "ai.AssistantChatResponse",
        422: "ai.AssistantChatResponse",
      },
      detail: {
        summary: "Run the unified AI assistant widget",
        tags: ["AI"],
      },
    },
  )
  .use(authPlugin)
  .get(
    "/models",
    async ({ db, status, request, user }) => {
      const response = await handleListModelsRequest({
        db,
        request,
        user,
      });

      return response.status === 200
        ? status(200, response.body as ActiveAiModel[])
        : status(403, response.body as string);
    },
    {
      response: {
        200: "ai.ModelOptionList",
        403: "ai.Error",
      },
      detail: {
        summary: "List all active AI models",
        tags: ["AI"],
      },
    },
  )
  .get(
    "/settings",
    async ({ db, user, status, request }) => {
      const response = await handleGetSettingsRequest({
        db,
        request,
        user,
      });

      return response.status === 200
        ? status(200, response.body as UserAiSettings)
        : status(403, response.body as string);
    },
    {
      response: {
        200: "ai.Settings",
        403: "ai.Error",
      },
      detail: {
        summary: "Fetch active AI models and the current user's default selection",
        tags: ["AI"],
      },
    },
  )
  .patch(
    "/settings/model",
    async ({ db, user, body, status, request }) => {
      const response = await handleUpdateSelectedModelRequest({
        body,
        db,
        request,
        user,
      });

      if (response.status === 200) {
        return status(200, response.body as UserAiSettings);
      }

      return response.status === 403
        ? status(403, response.body as string)
        : status(422, response.body as { code: typeof AI_MODEL_UNAVAILABLE_CODE; message: string });
    },
    {
      body: "ai.SelectModelInput",
      response: {
        200: "ai.Settings",
        403: "ai.Error",
        422: t.Object({
          code: t.Literal(AI_MODEL_UNAVAILABLE_CODE),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Update selected AI model for the current user",
        tags: ["AI"],
      },
    },
  )
  .post(
    "/copilot/optimize-section",
    async ({ body, db, user, status, request }) => {
      const response = await handleCopilotOptimizeRequest({
        body,
        db,
        request,
        user,
      });

      if (response.status === 200) {
        return status(200, response.body as ResumeCopilotOptimizeResponse);
      }

      if (response.status === 403) {
        return status(403, response.body as string);
      }

      if (response.status === 429) {
        return status(429, response.body as string);
      }

      return response.status === 422 ? status(422, response.body as string) : status(500, response.body as string);
    },
    {
      body: "ai.CopilotOptimizeInput",
      response: {
        200: "ai.CopilotOptimizeResponse",
        403: "ai.Error",
        422: "ai.Error",
        429: "ai.Error",
        500: "ai.Error",
      },
      detail: {
        summary: "Optimize a resume section with Resume Copilot",
        tags: ["AI", "Resume Copilot"],
      },
    },
  )
  .post(
    "/copilot/tailor",
    async ({ body, db, user, status, request }) => {
      const response = await handleCopilotTailorRequest({
        body,
        db,
        request,
        user,
      });

      if (response.status === 200) {
        return status(200, response.body as ResumeCopilotTailorResponse);
      }

      if (response.status === 403) {
        return status(403, response.body as string);
      }

      if (response.status === 429) {
        return status(429, response.body as string);
      }

      return response.status === 422 ? status(422, response.body as string) : status(500, response.body as string);
    },
    {
      body: "ai.CopilotTailorInput",
      response: {
        200: "ai.CopilotTailorResponse",
        403: "ai.Error",
        422: "ai.Error",
        429: "ai.Error",
        500: "ai.Error",
      },
      detail: {
        summary: "Tailor a resume to a job description",
        tags: ["AI", "Resume Copilot"],
      },
    },
  )
  .post(
    "/copilot/review",
    async ({ body, db, user, status, request }) => {
      const response = await handleCopilotReviewRequest({
        body,
        db,
        request,
        user,
      });

      if (response.status === 200) {
        return status(200, response.body as ResumeCopilotReviewResponse);
      }

      if (response.status === 403) {
        return status(403, response.body as string);
      }

      if (response.status === 429) {
        return status(429, response.body as string);
      }

      return response.status === 422 ? status(422, response.body as string) : status(500, response.body as string);
    },
    {
      body: "ai.CopilotReviewInput",
      response: {
        200: "ai.CopilotReviewResponse",
        403: "ai.Error",
        422: "ai.Error",
        429: "ai.Error",
        500: "ai.Error",
      },
      detail: {
        summary: "Review overall resume quality",
        tags: ["AI", "Resume Copilot"],
      },
    },
  )
  .post(
    "/optimize",
    async ({ body, set, status, db, user, request }) => {
      const response = await handleOptimizeTextRequest({
        body,
        db,
        request,
        user,
      });

      applyResponseHeaders(set.headers, response.headers);

      if (response.status === 200) {
        return response.body as AsyncGenerator<string, void, unknown>;
      }

      if (response.status === 403) {
        return status(403, response.body as string);
      }

      if (response.status === 429) {
        return status(429, response.body as { code: typeof AI_CREDITS_EXHAUSTED_CODE; message: string });
      }

      return status(
        422,
        response.body as
          | string
          | { code: typeof AI_MODEL_POLICY_RESTRICTED_CODE | typeof AI_MODEL_UNAVAILABLE_CODE; message: string },
      );
    },
    {
      body: "ai.OptimizeInput",
      response: {
        401: t.String({ default: "Authentication required." }),
        403: t.String({ default: "Please verify your email before using AI features." }),
        422: t.Union([
          t.String(),
          t.Object({
            code: t.Union([t.Literal(AI_MODEL_POLICY_RESTRICTED_CODE), t.Literal(AI_MODEL_UNAVAILABLE_CODE)]),
            message: t.String(),
          }),
        ]),
        429: t.Object({
          code: t.Literal(AI_CREDITS_EXHAUSTED_CODE),
          message: t.String({ default: "You have reached your daily AI credit limit." }),
        }),
      },
      detail: {
        summary: "Optimize text with streamed AI output",
        tags: ["AI"],
      },
    },
  );
