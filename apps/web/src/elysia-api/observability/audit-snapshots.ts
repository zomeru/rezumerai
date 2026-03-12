const PREVIEW_LENGTH = 120;
const MAX_SUMMARY_KEYS = 10;

interface SnapshotSelect {
  [key: string]: boolean | SnapshotSelect;
}

const AUDIT_SNAPSHOT_SELECTS: Record<string, SnapshotSelect> = {
  AiAssistantConversation: {
    id: true,
    scope: true,
    userId: true,
    threadId: true,
    lastUserMessageAt: true,
    createdAt: true,
    updatedAt: true,
  },
  AiAssistantConversationEmbedding: {
    id: true,
    conversationId: true,
    messageId: true,
    userId: true,
    scope: true,
    role: true,
    content: true,
    metadata: true,
    createdAt: true,
  },
  AiAssistantConversationMessage: {
    id: true,
    conversationId: true,
    role: true,
    content: true,
    blocks: true,
    toolNames: true,
    createdAt: true,
  },
  AiOptimization: {
    id: true,
    userId: true,
    resumeId: true,
    provider: true,
    model: true,
    promptVersion: true,
    status: true,
    inputCharCount: true,
    outputCharCount: true,
    chunkCount: true,
    durationMs: true,
    promptTokens: true,
    completionTokens: true,
    totalTokens: true,
    reasoningTokens: true,
    errorMessage: true,
    createdAt: true,
    updatedAt: true,
  },
  AiTextOptimizerCredits: {
    id: true,
    userId: true,
    credits: true,
    lastResetAt: true,
    createdAt: true,
    updatedAt: true,
  },
  Education: {
    id: true,
    resumeId: true,
    institution: true,
    degree: true,
    field: true,
    gpa: true,
    graduationDate: true,
    schoolYearStartDate: true,
    isCurrent: true,
  },
  ErrorLog: {
    id: true,
    errorName: true,
    message: true,
    endpoint: true,
    method: true,
    functionName: true,
    environment: true,
    createdAt: true,
    isRead: true,
    readAt: true,
    readByUserId: true,
  },
  Experience: {
    id: true,
    resumeId: true,
    company: true,
    position: true,
    description: true,
    isCurrent: true,
    startDate: true,
    endDate: true,
  },
  PersonalInformation: {
    id: true,
    resumeId: true,
    fullName: true,
    email: true,
    phone: true,
    location: true,
    linkedin: true,
    website: true,
    profession: true,
    image: true,
  },
  Project: {
    id: true,
    resumeId: true,
    name: true,
    type: true,
    description: true,
  },
  Resume: {
    id: true,
    userId: true,
    title: true,
    public: true,
    createdAt: true,
    updatedAt: true,
    professionalSummary: true,
    template: true,
    accentColor: true,
    fontSize: true,
    customFontSize: true,
    skills: true,
  },
  SystemConfiguration: {
    id: true,
    name: true,
    description: true,
    value: true,
    createdAt: true,
    updatedAt: true,
  },
  User: {
    id: true,
    name: true,
    email: true,
    emailVerified: true,
    image: true,
    createdAt: true,
    updatedAt: true,
    role: true,
    selectedAiModel: true,
    lastPasswordChangeAt: true,
    banned: true,
    banReason: true,
    banExpires: true,
    isAnonymous: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function summarizeText(value: unknown): { length: number; preview: string } | null {
  if (typeof value !== "string") {
    return null;
  }

  const preview = value.length > PREVIEW_LENGTH ? `${value.slice(0, PREVIEW_LENGTH)}...` : value;

  return {
    length: value.length,
    preview,
  };
}

function summarizeStructuredValue(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return {
      type: "array",
      itemCount: value.length,
    };
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);

    return {
      type: "object",
      keyCount: keys.length,
      keys: keys.slice(0, MAX_SUMMARY_KEYS),
      ...(keys.length > MAX_SUMMARY_KEYS ? { truncatedKeyCount: keys.length - MAX_SUMMARY_KEYS } : {}),
    };
  }

  if (typeof value === "string") {
    return {
      type: "string",
      ...summarizeText(value),
    };
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return {
      type: typeof value,
      value,
    };
  }

  if (value === null) {
    return {
      type: "null",
    };
  }

  return null;
}

function shapeResumeSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const professionalSummary = summarizeText(snapshot.professionalSummary);

  return {
    id: snapshot.id,
    userId: snapshot.userId,
    title: snapshot.title,
    public: snapshot.public,
    template: snapshot.template,
    accentColor: snapshot.accentColor,
    fontSize: snapshot.fontSize,
    customFontSize: snapshot.customFontSize,
    skillsCount: Array.isArray(snapshot.skills) ? snapshot.skills.length : 0,
    professionalSummaryLength: professionalSummary?.length ?? 0,
    professionalSummaryPreview: professionalSummary?.preview ?? "",
    createdAt: toIsoString(snapshot.createdAt),
    updatedAt: toIsoString(snapshot.updatedAt),
  };
}

function shapeUserSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const banReason = summarizeText(snapshot.banReason);

  return {
    id: snapshot.id,
    name: snapshot.name,
    email: snapshot.email,
    role: snapshot.role,
    emailVerified: snapshot.emailVerified,
    hasImage: Boolean(snapshot.image),
    selectedAiModel: snapshot.selectedAiModel,
    lastPasswordChangeAt: toIsoString(snapshot.lastPasswordChangeAt),
    banned: snapshot.banned,
    banReasonPreview: banReason?.preview ?? null,
    banExpires: toIsoString(snapshot.banExpires),
    isAnonymous: snapshot.isAnonymous,
    createdAt: toIsoString(snapshot.createdAt),
    updatedAt: toIsoString(snapshot.updatedAt),
  };
}

function shapePersonalInformationSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return {
    id: snapshot.id,
    resumeId: snapshot.resumeId,
    fullName: snapshot.fullName,
    profession: snapshot.profession,
    hasEmail: Boolean(snapshot.email),
    hasPhone: Boolean(snapshot.phone),
    hasLocation: Boolean(snapshot.location),
    hasLinkedin: Boolean(snapshot.linkedin),
    hasWebsite: Boolean(snapshot.website),
    hasImage: Boolean(snapshot.image),
  };
}

function shapeExperienceSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const description = summarizeText(snapshot.description);

  return {
    id: snapshot.id,
    resumeId: snapshot.resumeId,
    company: snapshot.company,
    position: snapshot.position,
    descriptionLength: description?.length ?? 0,
    descriptionPreview: description?.preview ?? "",
    isCurrent: snapshot.isCurrent,
    startDate: toIsoString(snapshot.startDate),
    endDate: toIsoString(snapshot.endDate),
  };
}

function shapeEducationSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return {
    id: snapshot.id,
    resumeId: snapshot.resumeId,
    institution: snapshot.institution,
    degree: snapshot.degree,
    field: snapshot.field,
    hasGpa: Boolean(snapshot.gpa),
    isCurrent: snapshot.isCurrent,
    schoolYearStartDate: toIsoString(snapshot.schoolYearStartDate),
    graduationDate: toIsoString(snapshot.graduationDate),
  };
}

function shapeProjectSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const description = summarizeText(snapshot.description);

  return {
    id: snapshot.id,
    resumeId: snapshot.resumeId,
    name: snapshot.name,
    type: snapshot.type,
    descriptionLength: description?.length ?? 0,
    descriptionPreview: description?.preview ?? "",
  };
}

function shapeSystemConfigurationSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return {
    id: snapshot.id,
    name: snapshot.name,
    description: snapshot.description,
    valueSummary: summarizeStructuredValue(snapshot.value),
    createdAt: toIsoString(snapshot.createdAt),
    updatedAt: toIsoString(snapshot.updatedAt),
  };
}

function shapeAiConversationSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return {
    id: snapshot.id,
    scope: snapshot.scope,
    userId: snapshot.userId,
    threadId: snapshot.threadId,
    lastUserMessageAt: toIsoString(snapshot.lastUserMessageAt),
    createdAt: toIsoString(snapshot.createdAt),
    updatedAt: toIsoString(snapshot.updatedAt),
  };
}

function shapeAiConversationMessageSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const content = summarizeText(snapshot.content);

  return {
    id: snapshot.id,
    conversationId: snapshot.conversationId,
    role: snapshot.role,
    contentLength: content?.length ?? 0,
    contentPreview: content?.preview ?? "",
    toolCount: Array.isArray(snapshot.toolNames) ? snapshot.toolNames.length : 0,
    blocksSummary: summarizeStructuredValue(snapshot.blocks),
    createdAt: toIsoString(snapshot.createdAt),
  };
}

function shapeAiConversationEmbeddingSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const content = summarizeText(snapshot.content);

  return {
    id: snapshot.id,
    conversationId: snapshot.conversationId,
    messageId: snapshot.messageId,
    userId: snapshot.userId,
    scope: snapshot.scope,
    role: snapshot.role,
    contentLength: content?.length ?? 0,
    contentPreview: content?.preview ?? "",
    metadataSummary: summarizeStructuredValue(snapshot.metadata),
    createdAt: toIsoString(snapshot.createdAt),
  };
}

function shapeAiOptimizationSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const errorMessage = summarizeText(snapshot.errorMessage);

  return {
    id: snapshot.id,
    userId: snapshot.userId,
    resumeId: snapshot.resumeId,
    provider: snapshot.provider,
    model: snapshot.model,
    promptVersion: snapshot.promptVersion,
    status: snapshot.status,
    inputCharCount: snapshot.inputCharCount,
    outputCharCount: snapshot.outputCharCount,
    chunkCount: snapshot.chunkCount,
    durationMs: snapshot.durationMs,
    promptTokens: snapshot.promptTokens,
    completionTokens: snapshot.completionTokens,
    totalTokens: snapshot.totalTokens,
    reasoningTokens: snapshot.reasoningTokens,
    errorMessagePreview: errorMessage?.preview ?? null,
    createdAt: toIsoString(snapshot.createdAt),
    updatedAt: toIsoString(snapshot.updatedAt),
  };
}

function shapeAiCreditsSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return {
    id: snapshot.id,
    userId: snapshot.userId,
    credits: snapshot.credits,
    lastResetAt: toIsoString(snapshot.lastResetAt),
    createdAt: toIsoString(snapshot.createdAt),
    updatedAt: toIsoString(snapshot.updatedAt),
  };
}

function shapeErrorLogSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const message = summarizeText(snapshot.message);

  return {
    id: snapshot.id,
    errorName: snapshot.errorName,
    messagePreview: message?.preview ?? null,
    messageLength: message?.length ?? 0,
    endpoint: snapshot.endpoint,
    method: snapshot.method,
    functionName: snapshot.functionName,
    environment: snapshot.environment,
    isRead: snapshot.isRead,
    readAt: toIsoString(snapshot.readAt),
    readByUserId: snapshot.readByUserId,
    createdAt: toIsoString(snapshot.createdAt),
  };
}

export function getAuditSnapshotSelect(model: string): SnapshotSelect | null {
  return AUDIT_SNAPSHOT_SELECTS[model] ?? null;
}

export function shapeAuditSnapshot(model: string, snapshot: unknown): unknown {
  if (!isRecord(snapshot)) {
    return snapshot;
  }

  switch (model) {
    case "Resume":
      return shapeResumeSnapshot(snapshot);
    case "User":
      return shapeUserSnapshot(snapshot);
    case "PersonalInformation":
      return shapePersonalInformationSnapshot(snapshot);
    case "Experience":
      return shapeExperienceSnapshot(snapshot);
    case "Education":
      return shapeEducationSnapshot(snapshot);
    case "Project":
      return shapeProjectSnapshot(snapshot);
    case "SystemConfiguration":
      return shapeSystemConfigurationSnapshot(snapshot);
    case "AiAssistantConversation":
      return shapeAiConversationSnapshot(snapshot);
    case "AiAssistantConversationMessage":
      return shapeAiConversationMessageSnapshot(snapshot);
    case "AiAssistantConversationEmbedding":
      return shapeAiConversationEmbeddingSnapshot(snapshot);
    case "AiOptimization":
      return shapeAiOptimizationSnapshot(snapshot);
    case "AiTextOptimizerCredits":
      return shapeAiCreditsSnapshot(snapshot);
    case "ErrorLog":
      return shapeErrorLogSnapshot(snapshot);
    default:
      return snapshot;
  }
}
