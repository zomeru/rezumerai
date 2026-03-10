import { z } from "zod";
import type {
  AssistantAllowedToolScope,
  AssistantIntentCategory,
  AssistantIntentClassification,
  AssistantRequiredRole,
} from "../types";

const assistantIntentCategorySchema = z.enum(["general", "public", "user_private", "admin_private"]);
const assistantAllowedToolScopeSchema = z.enum(["none", "public", "user", "admin"]);
const assistantRequiredRoleSchema = z.union([z.literal("USER"), z.literal("ADMIN"), z.null()]);

const assistantIntentClassificationSchema = z.object({
  category: assistantIntentCategorySchema,
  requiresAuth: z.boolean(),
  requiredRole: assistantRequiredRoleSchema,
  allowedToolScope: assistantAllowedToolScopeSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(160),
});

function createIntentClassification(input: {
  allowedToolScope: AssistantAllowedToolScope;
  category: AssistantIntentCategory;
  confidence: number;
  reason: string;
  requiredRole: AssistantRequiredRole;
  requiresAuth: boolean;
}): AssistantIntentClassification {
  return assistantIntentClassificationSchema.parse(input);
}

function hasWord(normalized: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(normalized);
}

function hasAnyWord(normalized: string, words: string[]): boolean {
  return words.some((word) => hasWord(normalized, word));
}

function isSimpleGreeting(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  if (normalized.length === 0 || normalized.split(/\s+/).length > 4) {
    return false;
  }

  return /^(hi|hello|hey|yo|howdy|greetings|good (morning|afternoon|evening))[!.?]*$/.test(normalized);
}

function isPublicPrivacyRequest(normalized: string): boolean {
  return (
    /\b(privacy policy|website privacy|site privacy|privacy notice)\b/.test(normalized) ||
    (hasWord(normalized, "privacy") && hasAnyWord(normalized, ["policy", "website", "site", "app"]))
  );
}

function isPublicTermsRequest(normalized: string): boolean {
  return (
    /\b(terms of service|website tos|website terms|site terms|\btos\b)\b/.test(normalized) ||
    (hasWord(normalized, "terms") && hasAnyWord(normalized, ["service", "website", "site", "app"]))
  );
}

function isPublicFaqRequest(normalized: string): boolean {
  return /\b(faq|frequently asked questions|help center|help docs)\b/.test(normalized);
}

function isPublicAboutRequest(normalized: string): boolean {
  return (
    /\b(about rezumerai|about page|about this app|about your app|who are you)\b/.test(normalized) ||
    (hasWord(normalized, "about") && hasAnyWord(normalized, ["rezumerai", "company", "team", "app"]))
  );
}

function isPublicContactRequest(normalized: string): boolean {
  return (
    /\b(contact page|contact info|support email|how do i contact|how can i contact)\b/.test(normalized) ||
    (hasAnyWord(normalized, ["contact", "support"]) && hasAnyWord(normalized, ["email", "page", "info", "reach"]))
  );
}

function isPublicOverviewRequest(normalized: string): boolean {
  return /\b(what does this app do|what is rezumerai|what can this app do|what can rezumerai do|features|resume copilot)\b/.test(
    normalized,
  );
}

function isUserResumeRequest(normalized: string): boolean {
  return (
    /\b(my resumes?|my resume list|show my resumes?|list my resumes?)\b/.test(normalized) ||
    (hasWord(normalized, "my") && hasAnyWord(normalized, ["resume", "resumes"]))
  );
}

function isUserDraftRequest(normalized: string): boolean {
  return (
    /\b(my drafts?|show my drafts?|list my drafts?)\b/.test(normalized) ||
    (hasWord(normalized, "my") && hasAnyWord(normalized, ["draft", "drafts"]))
  );
}

function isUserCreditsRequest(normalized: string): boolean {
  return /\b(my credits?|remaining credits|credits do i have)\b/.test(normalized);
}

function isUserModelRequest(normalized: string): boolean {
  return /\b(current model|selected model|model settings?)\b/.test(normalized);
}

function isAdminConfigurationRequest(normalized: string): boolean {
  return /\b(ai[_\s-]*config|ai configuration|system configuration|system config|configuration)\b/.test(normalized);
}

function isAdminErrorRequest(normalized: string): boolean {
  return /\b(error|errors|error log|error logs)\b/.test(normalized) && !/\baudit\b/.test(normalized);
}

function isAdminAuditRequest(normalized: string): boolean {
  return /\baudit log|audit logs\b/.test(normalized);
}

function isAdminAnalyticsRequest(normalized: string): boolean {
  return /\banalytics|error rate|request count|active users\b/.test(normalized);
}

function isAdminUsersRequest(normalized: string): boolean {
  return (
    /\b(registered users|all users|list users|show users|user accounts|registered user)\b/.test(normalized) ||
    (hasAnyWord(normalized, ["user", "users"]) &&
      hasAnyWord(normalized, ["registered", "registration", "account", "accounts", "website", "site", "app", "all"]))
  );
}

export function classifyAssistantIntent(message: string): AssistantIntentClassification {
  const normalized = message.trim().toLowerCase();

  if (
    isPublicPrivacyRequest(normalized) ||
    isPublicTermsRequest(normalized) ||
    isPublicFaqRequest(normalized) ||
    isPublicAboutRequest(normalized) ||
    isPublicContactRequest(normalized) ||
    isPublicOverviewRequest(normalized)
  ) {
    return createIntentClassification({
      category: "public",
      requiresAuth: false,
      requiredRole: null,
      allowedToolScope: "public",
      confidence: 0.98,
      reason: "Asked for public RezumerAI site content or public product information.",
    });
  }

  if (
    isUserResumeRequest(normalized) ||
    isUserDraftRequest(normalized) ||
    isUserCreditsRequest(normalized) ||
    isUserModelRequest(normalized)
  ) {
    return createIntentClassification({
      category: "user_private",
      requiresAuth: true,
      requiredRole: "USER",
      allowedToolScope: "user",
      confidence: 0.98,
      reason: "Asked for the current user's private account or resume data.",
    });
  }

  if (
    isAdminConfigurationRequest(normalized) ||
    isAdminErrorRequest(normalized) ||
    isAdminAuditRequest(normalized) ||
    isAdminAnalyticsRequest(normalized) ||
    isAdminUsersRequest(normalized)
  ) {
    return createIntentClassification({
      category: "admin_private",
      requiresAuth: true,
      requiredRole: "ADMIN",
      allowedToolScope: "admin",
      confidence: 0.99,
      reason: "Asked for admin-only operational, configuration, analytics, or system data.",
    });
  }

  return createIntentClassification({
    category: "general",
    requiresAuth: false,
    requiredRole: null,
    allowedToolScope: "none",
    confidence: isSimpleGreeting(message) ? 0.99 : 0.9,
    reason: isSimpleGreeting(message)
      ? "Simple greeting or casual conversation."
      : "General prompt that does not require application data access.",
  });
}

export {
  isAdminAnalyticsRequest,
  isAdminAuditRequest,
  isAdminConfigurationRequest,
  isAdminErrorRequest,
  isAdminUsersRequest,
  isPublicAboutRequest,
  isPublicContactRequest,
  isPublicFaqRequest,
  isPublicOverviewRequest,
  isPublicPrivacyRequest,
  isPublicTermsRequest,
  isUserCreditsRequest,
  isUserDraftRequest,
  isUserModelRequest,
  isUserResumeRequest,
};
