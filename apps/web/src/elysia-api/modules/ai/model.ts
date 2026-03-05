import Elysia, { t } from "elysia";

const AiConfiguration = t.Object({
  PROMPT_VERSION: t.String({ minLength: 1, maxLength: 100 }),
  DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: t.Integer({ minimum: 1, maximum: 1000 }),
  OPTIMIZE_SYSTEM_PROMPT: t.String({ minLength: 1, maxLength: 10000 }),
});

const AiModelOption = t.Object({
  id: t.String(),
  name: t.String(),
  modelId: t.String(),
  providerName: t.String(),
  providerDisplayName: t.String(),
});

const AiSettings = t.Object({
  models: t.Array(AiModelOption),
  selectedModelId: t.String(),
  isAdmin: t.Boolean(),
  config: t.Nullable(AiConfiguration),
});

export const AiModel = new Elysia().model({
  "ai.OptimizeInput": t.Object({
    text: t.String({ minLength: 1, description: "Text to optimize" }),
    resumeId: t.Optional(t.String({ minLength: 1, description: "Optional source resume ID" })),
    modelId: t.Optional(t.String({ minLength: 1, description: "Optional AI model override" })),
  }),
  "ai.ModelOption": AiModelOption,
  "ai.ModelOptionList": t.Array(AiModelOption),
  "ai.Settings": AiSettings,
  "ai.SelectModelInput": t.Object({
    modelId: t.String({ minLength: 1 }),
  }),
  "ai.UpdateConfigurationInput": AiConfiguration,
  "ai.ForbiddenError": t.Object({
    code: t.String(),
    message: t.String(),
  }),
  "ai.Error": t.String(),
} as const);
