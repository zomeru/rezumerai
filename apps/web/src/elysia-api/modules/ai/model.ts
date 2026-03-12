import Elysia, { t } from "elysia";

const AiModelOption = t.Object({
  id: t.String({ minLength: 1, maxLength: 200 }),
  name: t.String({ minLength: 1, maxLength: 200 }),
  contextLength: t.Integer({ minimum: 0, maximum: 10_000_000 }),
  inputModalities: t.Array(t.String()),
  outputModalities: t.Array(t.String()),
  supportedParameters: t.Array(t.String()),
});

const AiSettings = t.Object({
  models: t.Array(AiModelOption),
  selectedModelId: t.String(),
});

const AssistantMessage = t.Object({
  role: t.Union([t.Literal("user"), t.Literal("assistant")]),
  content: t.String({ minLength: 1, maxLength: 2000 }),
});

const AssistantReplyBlock = t.Union([
  t.Object({
    type: t.Literal("paragraph"),
    content: t.String({ minLength: 1, maxLength: 4000 }),
  }),
  t.Object({
    type: t.Literal("unordered-list"),
    items: t.Array(t.String({ minLength: 1, maxLength: 4000 }), { minItems: 1, maxItems: 20 }),
  }),
  t.Object({
    type: t.Literal("ordered-list"),
    items: t.Array(t.String({ minLength: 1, maxLength: 4000 }), { minItems: 1, maxItems: 20 }),
  }),
]);

const AssistantHistoryMessage = t.Object({
  id: t.String({ minLength: 1, maxLength: 100 }),
  role: t.Union([t.Literal("user"), t.Literal("assistant")]),
  content: t.String({ minLength: 1, maxLength: 4000 }),
  blocks: t.Optional(t.Array(AssistantReplyBlock, { maxItems: 40 })),
  createdAt: t.String(),
});

const ResumeSectionTarget = t.Object({
  section: t.Union([
    t.Literal("professionalSummary"),
    t.Literal("skills"),
    t.Literal("experience"),
    t.Literal("education"),
    t.Literal("project"),
  ]),
  itemId: t.Optional(t.String({ minLength: 1 })),
});

const ResumeCopilotSuggestion = t.Object({
  title: t.String(),
  rationale: t.String(),
  originalText: t.String(),
  suggestedText: t.String(),
  cautions: t.Array(t.String()),
  draftPatch: t.Any(),
});

const ResumeCopilotTailorSuggestion = t.Object({
  target: ResumeSectionTarget,
  reason: t.String(),
  suggestion: t.String(),
  cautions: t.Array(t.String()),
  draftPatch: t.Any(),
});

const ResumeCopilotReviewFinding = t.Object({
  severity: t.Union([t.Literal("high"), t.Literal("medium"), t.Literal("low")]),
  section: t.String(),
  message: t.String(),
  fix: t.String(),
});

export const AiModel = new Elysia().model({
  "ai.OptimizeInput": t.Object({
    prompt: t.Optional(t.String({ minLength: 1, description: "AI SDK completion prompt to optimize" })),
    text: t.Optional(t.String({ minLength: 1, description: "Legacy text payload to optimize" })),
    resumeId: t.Optional(t.String({ minLength: 1, description: "Optional source resume ID" })),
    modelId: t.Optional(t.String({ minLength: 1, description: "Optional AI model override" })),
  }),
  "ai.ModelOption": AiModelOption,
  "ai.ModelOptionList": t.Array(AiModelOption),
  "ai.Settings": AiSettings,
  "ai.SelectModelInput": t.Object({
    modelId: t.String({ minLength: 1 }),
  }),
  "ai.AssistantChatInput": t.Object({
    threadId: t.String({ minLength: 1, maxLength: 120 }),
    messages: t.Array(AssistantMessage, { minItems: 1, maxItems: 12 }),
    currentPath: t.Optional(t.String({ maxLength: 200 })),
  }),
  "ai.AssistantChatResponse": t.Object({
    scope: t.Union([t.Literal("PUBLIC"), t.Literal("USER"), t.Literal("ADMIN")]),
    reply: t.String(),
    blocks: t.Array(AssistantReplyBlock, { maxItems: 40 }),
    toolNames: t.Array(t.String()),
    usedConversationMemory: t.Boolean(),
  }),
  "ai.AssistantHistoryQuery": t.Object({
    threadId: t.String({ minLength: 1, maxLength: 120 }),
    cursor: t.Optional(t.String({ minLength: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50, default: 20 })),
  }),
  "ai.AssistantHistoryMessage": AssistantHistoryMessage,
  "ai.AssistantHistoryResponse": t.Object({
    scope: t.Union([t.Literal("PUBLIC"), t.Literal("USER"), t.Literal("ADMIN")]),
    messages: t.Array(AssistantHistoryMessage, { maxItems: 50 }),
    nextCursor: t.Nullable(t.String({ minLength: 1 })),
    hasMore: t.Boolean(),
  }),
  "ai.ResumeSectionTarget": ResumeSectionTarget,
  "ai.CopilotOptimizeInput": t.Object({
    resumeId: t.String({ minLength: 1 }),
    target: ResumeSectionTarget,
    intent: t.Optional(
      t.Union([
        t.Literal("clarity"),
        t.Literal("impact"),
        t.Literal("ats"),
        t.Literal("concise"),
        t.Literal("grammar"),
      ]),
    ),
  }),
  "ai.CopilotOptimizeResponse": t.Object({
    target: ResumeSectionTarget,
    intent: t.Union([
      t.Literal("clarity"),
      t.Literal("impact"),
      t.Literal("ats"),
      t.Literal("concise"),
      t.Literal("grammar"),
    ]),
    modelId: t.String(),
    creditsRemaining: t.Integer(),
    suggestion: ResumeCopilotSuggestion,
  }),
  "ai.CopilotTailorInput": t.Object({
    resumeId: t.String({ minLength: 1 }),
    jobDescription: t.String({ minLength: 20, maxLength: 12000 }),
  }),
  "ai.CopilotTailorResponse": t.Object({
    modelId: t.String(),
    creditsRemaining: t.Integer(),
    jobTitle: t.Nullable(t.String()),
    priorities: t.Array(t.String()),
    matches: t.Array(t.String()),
    gaps: t.Array(t.String()),
    suggestions: t.Array(ResumeCopilotTailorSuggestion),
  }),
  "ai.CopilotReviewInput": t.Object({
    resumeId: t.String({ minLength: 1 }),
    jobDescription: t.Optional(t.String({ maxLength: 12000 })),
  }),
  "ai.CopilotReviewResponse": t.Object({
    modelId: t.String(),
    creditsRemaining: t.Integer(),
    overallScore: t.Integer({ minimum: 0, maximum: 100 }),
    summary: t.String(),
    strengths: t.Array(t.String()),
    findings: t.Array(ResumeCopilotReviewFinding),
    nextSteps: t.Array(t.String()),
  }),
  "ai.Error": t.String(),
} as const);
