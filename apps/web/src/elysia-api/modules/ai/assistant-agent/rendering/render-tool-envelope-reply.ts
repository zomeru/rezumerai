import { ContentPageSchema, FaqInformationSchema } from "@rezumerai/types";
import { ASSISTANT_SAFE_RETRIEVAL_REPLY } from "../constants";
import { assistantToolEnvelopeSchema, publicAppOverviewSchema } from "../tools";
import type { AssistantToolEnvelope } from "../types";
import {
  formatCompactRecord,
  formatPreviewOverflow,
  formatReplyDate,
  formatResumeLine,
  formatValue,
  humanizeKey,
  isRecord,
  joinReplySections,
  MAX_COLLECTION_PREVIEW_ITEMS,
  prioritizeEntries,
  toBulletList,
  toOrderedList,
} from "../utils";

function renderCollectionReply(
  envelope: Extract<AssistantToolEnvelope, { type: "collection" }>,
  options: {
    emptyMessage: string;
    intro: string;
    renderItem: (item: Record<string, unknown>) => string;
  },
): string {
  if (envelope.items.length === 0) {
    return options.emptyMessage;
  }

  const previewItems = envelope.items.slice(0, MAX_COLLECTION_PREVIEW_ITEMS);

  return joinReplySections([
    options.intro,
    toBulletList(previewItems.map((item) => options.renderItem(item))),
    formatPreviewOverflow(envelope.items.length, previewItems.length),
  ]);
}

function renderContentPageReply(item: Record<string, unknown>): string | null {
  const parsed = ContentPageSchema.safeParse(item);
  if (!parsed.success) {
    return null;
  }

  const page = parsed.data;

  return joinReplySections([
    `**${page.title}**`,
    page.summary,
    `Last updated: ${page.lastUpdated}.`,
    ...page.sections.map((section) =>
      joinReplySections([
        `**${section.heading}**`,
        ...section.paragraphs,
        section.bullets.length > 0 ? toBulletList(section.bullets) : null,
      ]),
    ),
    ...page.cards.map((card) =>
      joinReplySections([
        `**${card.title}**`,
        card.description,
        card.items.length > 0 ? toBulletList(card.items) : null,
      ]),
    ),
    page.cta ? `Next step: ${page.cta.label} (${page.cta.href}).` : null,
  ]);
}

function renderFaqReply(item: Record<string, unknown>): string | null {
  const parsed = FaqInformationSchema.safeParse(item);
  if (!parsed.success) {
    return null;
  }

  const faq = parsed.data;

  return joinReplySections([
    `**${faq.title}**`,
    faq.summary,
    ...faq.categories.map((category) =>
      joinReplySections([
        `**${category.title}**`,
        toOrderedList(category.items.map((entry) => `**${entry.question}** ${entry.answer}`)),
      ]),
    ),
  ]);
}

function renderPublicAppOverviewReply(item: Record<string, unknown>): string | null {
  const parsed = publicAppOverviewSchema.safeParse(item);
  if (!parsed.success) {
    return null;
  }

  const overview = parsed.data;

  return joinReplySections([
    overview.summary,
    overview.features.length > 0
      ? joinReplySections([
          "Here are some of its key features:",
          toBulletList(overview.features.map((feature) => `**${feature.title}** ${feature.description}`)),
        ])
      : null,
    overview.trustBadges.length > 0
      ? joinReplySections(["Additional benefits include:", toBulletList(overview.trustBadges)])
      : null,
    overview.workflow.length > 0
      ? joinReplySections([
          "Typical workflow:",
          toBulletList(overview.workflow.map((step) => `**${step.title}** ${step.description}`)),
        ])
      : null,
    overview.cta ? `Next step: ${overview.cta.label} (${overview.cta.href}).` : null,
  ]);
}

function renderMetricReply(envelope: Extract<AssistantToolEnvelope, { type: "metric" }>): string | null {
  if (envelope.entity === "optimization_credits") {
    const remainingCredits = typeof envelope.data.remainingCredits === "number" ? envelope.data.remainingCredits : null;
    const dailyLimit = typeof envelope.data.dailyLimit === "number" ? envelope.data.dailyLimit : null;

    if (remainingCredits !== null && dailyLimit !== null) {
      return `You have ${remainingCredits} of ${dailyLimit} AI optimization credits remaining today.`;
    }
  }

  if (envelope.entity === "ai_model_settings") {
    const selectedModelId =
      typeof envelope.data.selectedModelId === "string" && envelope.data.selectedModelId.trim().length > 0
        ? envelope.data.selectedModelId
        : null;
    const models = Array.isArray(envelope.data.models)
      ? envelope.data.models.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    return joinReplySections([
      selectedModelId ? `Your current AI model is **${selectedModelId}**.` : "You have not selected an AI model yet.",
      models.length > 0 ? joinReplySections(["Available models:", toBulletList(models)]) : null,
    ]);
  }

  if (envelope.entity === "analytics_summary") {
    const timeframeDays = typeof envelope.data.timeframeDays === "number" ? envelope.data.timeframeDays : null;
    const requestCount = typeof envelope.data.requestCount === "number" ? envelope.data.requestCount : null;
    const errorCount = typeof envelope.data.errorCount === "number" ? envelope.data.errorCount : null;
    const activeUsers = typeof envelope.data.activeUsers === "number" ? envelope.data.activeUsers : null;

    if (timeframeDays !== null && requestCount !== null && errorCount !== null && activeUsers !== null) {
      return `In the last ${timeframeDays} days, Rezumerai recorded ${requestCount} API requests, ${errorCount} error responses, and ${activeUsers} active signed-in users.`;
    }
  }

  if (envelope.entity === "ai_configuration") {
    const labels: Record<string, string> = {
      ASSISTANT_CONTEXT_TOKEN_LIMIT: "Assistant context token limit",
      ASSISTANT_HISTORY_LIMIT: "Assistant history limit",
      ASSISTANT_MAX_STEPS: "Assistant max steps",
      ASSISTANT_RAG_ENABLED: "Assistant RAG enabled",
      ASSISTANT_RAG_RECENT_LIMIT: "Assistant RAG recent limit",
      ASSISTANT_RAG_TOP_K: "Assistant RAG top K",
      ASSISTANT_SYSTEM_PROMPT: "Assistant system prompt",
      COPILOT_SYSTEM_PROMPT: "Copilot system prompt",
      DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: "Daily optimizer credit limit",
      EMBEDDING_DIMENSIONS: "Embedding dimensions",
      EMBEDDING_MODEL: "Embedding model",
      EMBEDDING_PROVIDER: "Embedding provider",
      OPTIMIZE_SYSTEM_PROMPT: "Optimize system prompt",
      PROMPT_VERSION: "Prompt version",
    };

    const items = Object.entries(labels)
      .map(([key, label]) => {
        const value = envelope.data[key];

        return value === null || value === undefined ? null : `**${label}:** ${formatValue(value)}`;
      })
      .filter((value): value is string => Boolean(value));

    return joinReplySections([
      "Here is the current AI configuration used by the app.",
      items.length > 0 ? toBulletList(items) : null,
    ]);
  }

  return null;
}

function renderDetailReply(envelope: Extract<AssistantToolEnvelope, { type: "detail" }>): string | null {
  if (envelope.entity === "public_app_overview") {
    return renderPublicAppOverviewReply(envelope.item);
  }

  if (envelope.entity === "faq") {
    return renderFaqReply(envelope.item);
  }

  if (
    envelope.entity === "about_page" ||
    envelope.entity === "contact_page" ||
    envelope.entity === "privacy_policy" ||
    envelope.entity === "terms_of_service"
  ) {
    return renderContentPageReply(envelope.item);
  }

  return null;
}

function renderEntityCollectionReply(envelope: Extract<AssistantToolEnvelope, { type: "collection" }>): string | null {
  if (envelope.entity === "resume") {
    return renderCollectionReply(envelope, {
      emptyMessage: "You do not have any resumes yet.",
      intro: "Here are your most recent resumes.",
      renderItem: (item) => formatResumeLine(item, "Untitled resume"),
    });
  }

  if (envelope.entity === "draft") {
    return renderCollectionReply(envelope, {
      emptyMessage: "You do not have any drafts yet.",
      intro: "Here are your most recent private drafts.",
      renderItem: (item) => formatResumeLine(item, "Untitled draft"),
    });
  }

  if (envelope.entity === "user") {
    return renderCollectionReply(envelope, {
      emptyMessage: "No registered users were found.",
      intro: "Here are the most recent registered users.",
      renderItem: (item) => {
        const name = typeof item.name === "string" && item.name.trim().length > 0 ? item.name : "Unnamed user";
        const joinedAt = formatReplyDate(item.createdAt);
        const details = [
          typeof item.email === "string" ? item.email : null,
          typeof item.role === "string" ? `Role: ${item.role}.` : null,
          joinedAt ? `Joined ${joinedAt}.` : null,
        ].filter(Boolean);

        return `**${name}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
      },
    });
  }

  if (envelope.entity === "error_log") {
    return renderCollectionReply(envelope, {
      emptyMessage: "No recent error logs were found.",
      intro: "Here are the most recent error logs.",
      renderItem: (item) => {
        const errorName =
          typeof item.errorName === "string" && item.errorName.trim().length > 0 ? item.errorName : "Unknown error";
        const loggedAt = formatReplyDate(item.createdAt);
        const details = [
          typeof item.method === "string" && typeof item.endpoint === "string"
            ? `${item.method} ${item.endpoint}.`
            : typeof item.endpoint === "string" && item.endpoint.trim().length > 0
              ? `${item.endpoint}.`
              : null,
          typeof item.functionName === "string" && item.functionName.trim().length > 0
            ? `Function: ${item.functionName}.`
            : null,
          typeof item.isRead === "boolean" ? `Status: ${item.isRead ? "read" : "unread"}.` : null,
          loggedAt ? `Logged ${loggedAt}.` : null,
        ].filter(Boolean);

        return `**${errorName}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
      },
    });
  }

  if (envelope.entity === "audit_log") {
    return renderCollectionReply(envelope, {
      emptyMessage: "No recent audit logs were found.",
      intro: "Here are the most recent audit log entries.",
      renderItem: (item) => {
        const action = typeof item.action === "string" && item.action.trim().length > 0 ? item.action : "Activity";
        const loggedAt = formatReplyDate(item.createdAt);
        const details = [
          typeof item.eventType === "string" ? item.eventType : null,
          typeof item.resourceType === "string" && item.resourceType.trim().length > 0
            ? `Resource: ${item.resourceType}.`
            : null,
          typeof item.actorEmail === "string" && item.actorEmail.trim().length > 0
            ? `Actor: ${item.actorEmail}.`
            : null,
          loggedAt ? `Logged ${loggedAt}.` : null,
        ].filter(Boolean);

        return `**${action}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
      },
    });
  }

  return null;
}

export function renderToolEnvelopeReply(result: unknown): string {
  const parsed = assistantToolEnvelopeSchema.safeParse(result);
  if (!parsed.success) {
    return ASSISTANT_SAFE_RETRIEVAL_REPLY;
  }

  const envelope = parsed.data as AssistantToolEnvelope;

  if (envelope.type === "collection") {
    return (
      renderEntityCollectionReply(envelope) ??
      (envelope.items.length === 0
        ? joinReplySections([envelope.summary, "No records found."])
        : joinReplySections([
            envelope.summary,
            toBulletList(
              envelope.items
                .slice(0, MAX_COLLECTION_PREVIEW_ITEMS)
                .map((item) => (isRecord(item) ? formatCompactRecord(item) : formatValue(item))),
            ),
            formatPreviewOverflow(envelope.items.length, Math.min(envelope.items.length, MAX_COLLECTION_PREVIEW_ITEMS)),
          ]))
    );
  }

  if (envelope.type === "detail") {
    return (
      renderDetailReply(envelope) ??
      joinReplySections([
        envelope.summary,
        toBulletList(
          prioritizeEntries(envelope.item)
            .filter(([, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `**${humanizeKey(key)}:** ${formatValue(value)}`),
        ),
      ])
    );
  }

  return (
    renderMetricReply(envelope) ??
    joinReplySections([
      envelope.summary,
      toBulletList(
        prioritizeEntries(envelope.data)
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([key, value]) => `**${humanizeKey(key)}:** ${formatValue(value)}`),
      ),
    ])
  );
}
