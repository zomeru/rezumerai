import Elysia, { t } from "elysia";

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
  "ai.Error": t.String(),
} as const);
