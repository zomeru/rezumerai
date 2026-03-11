import Elysia, { t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { AI_CREDITS_EXHAUSTED_CODE, AI_MODEL_POLICY_RESTRICTED_CODE, AI_MODEL_UNAVAILABLE_CODE } from "./constants";
import {
  handleAssistantChatStreamRequest,
  handleAssistantMessagesRequest,
  handleCopilotOptimizeRequest,
  handleCopilotReviewRequest,
  handleCopilotTailorRequest,
  handleGetSettingsRequest,
  handleListModelsRequest,
  handleOptimizeTextRequest,
  handleUpdateSelectedModelRequest,
} from "./controller";
import { AiModel } from "./model";
import {
  applyResponseHeaders,
  respondCopilot,
  respondOkOrForbidden,
  respondOptimizeText,
  respondSelectedModelUpdate,
} from "./route-response";

export const aiModule = new Elysia({ name: "module/ai", prefix: "/ai" })
  .use(prismaPlugin)
  .use(AiModel)
  .post(
    "/assistant/chat",
    async ({ body, db, request }) => {
      return handleAssistantChatStreamRequest({
        body,
        db,
        request,
      });
    },
    {
      detail: {
        summary: "Stream assistant chat messages with AI SDK UI",
        tags: ["AI"],
      },
    },
  )
  .get(
    "/assistant/messages",
    async ({ db, query, status, request, set }) => {
      const response = await handleAssistantMessagesRequest({
        db,
        query,
        request,
      });

      applyResponseHeaders(set.headers, response.headers);
      return status(response.status, response.body);
    },
    {
      query: "ai.AssistantHistoryQuery",
      detail: {
        summary: "Fetch persisted assistant UI messages for the current identity",
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

      return respondOkOrForbidden(response, {
        200: (body) => status(200, body),
        403: (body) => status(403, body),
      });
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

      return respondOkOrForbidden(response, {
        200: (body) => status(200, body),
        403: (body) => status(403, body),
      });
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

      return respondSelectedModelUpdate(response, {
        200: (body) => status(200, body),
        403: (body) => status(403, body),
        422: (body) => status(422, body),
      });
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

      return respondCopilot(response, {
        200: (body) => status(200, body),
        403: (body) => status(403, body),
        422: (body) => status(422, body),
        429: (body) => status(429, body),
        500: (body) => status(500, body),
      });
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

      return respondCopilot(response, {
        200: (body) => status(200, body),
        403: (body) => status(403, body),
        422: (body) => status(422, body),
        429: (body) => status(429, body),
        500: (body) => status(500, body),
      });
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

      return respondCopilot(response, {
        200: (body) => status(200, body),
        403: (body) => status(403, body),
        422: (body) => status(422, body),
        429: (body) => status(429, body),
        500: (body) => status(500, body),
      });
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

      return respondOptimizeText(response, {
        200: (body) => body,
        403: (body) => status(403, body),
        422: (body) => status(422, body),
        429: (body) => status(429, body),
      });
    },
    {
      body: "ai.OptimizeInput",
      response: {
        401: t.String({ default: "Authentication required." }),
        403: t.String({ default: "AI access is not available for the current account state." }),
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
