import type {
  ContentPage,
  FaqInformation,
  LandingPageInformation,
  PublicContentTopic,
  SystemConfigurationEntry,
  SystemConfigurationListResponse,
} from "@rezumerai/types";
import { ContentPageSchema, FaqInformationSchema, LandingPageInformationSchema } from "@rezumerai/types";
import type { z } from "zod";
import {
  type AdminContentTopicMetadata,
  getAdminContentConfigEntries,
  getAdminContentTopicMetadata,
} from "./topic-metadata";

export type AdminContentDraftValue = ContentPage | FaqInformation | LandingPageInformation;
export type AdminContentDraftMap = Partial<Record<PublicContentTopic, AdminContentDraftValue>>;
export type AdminContentEntry = SystemConfigurationEntry & { metadata: AdminContentTopicMetadata };

export function getAdminContentEntries(response?: SystemConfigurationListResponse): AdminContentEntry[] {
  if (!response) {
    return [];
  }

  return getAdminContentConfigEntries(response);
}

export function getAdminContentEntryByTopic(
  entries: AdminContentEntry[],
  topic: PublicContentTopic,
): AdminContentEntry | null {
  return entries.find((entry) => entry.metadata.topic === topic) ?? null;
}

export function createInitialDraftMap(entries: AdminContentEntry[]): AdminContentDraftMap {
  return entries.reduce<AdminContentDraftMap>((accumulator, entry) => {
    accumulator[entry.metadata.topic] = entry.value as AdminContentDraftValue;
    return accumulator;
  }, {});
}

export function areAdminContentValuesEqual(
  left: AdminContentDraftValue | null | undefined,
  right: AdminContentDraftValue | null | undefined,
): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function formatAdminContentJson(value: AdminContentDraftValue): string {
  return JSON.stringify(value, null, 2);
}

export function getAdminContentSchemaFamily(topic: PublicContentTopic) {
  return getAdminContentTopicMetadata(topic).schemaFamily;
}

function getSchemaForTopic(topic: PublicContentTopic) {
  const schemaFamily = getAdminContentSchemaFamily(topic);

  if (schemaFamily === "LANDING_PAGE") {
    return LandingPageInformationSchema;
  }

  if (schemaFamily === "FAQ") {
    return FaqInformationSchema;
  }

  return ContentPageSchema;
}

function formatZodError(error: z.ZodError): string {
  const [firstIssue] = error.issues;

  if (!firstIssue) {
    return "Content does not match the expected schema.";
  }

  const path = firstIssue.path.length ? firstIssue.path.join(".") : "root";
  return `${path}: ${firstIssue.message}`;
}

export function parseAdminContentRawJson(
  text: string,
): { success: true; data: unknown } | { success: false; error: string } {
  try {
    return {
      success: true,
      data: JSON.parse(text),
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : "Unable to parse JSON."}`,
    };
  }
}

export function validateAdminContentValue(
  topic: PublicContentTopic,
  value: unknown,
): { success: true; data: AdminContentDraftValue } | { success: false; error: string } {
  const parsed = getSchemaForTopic(topic).safeParse(value);

  if (!parsed.success) {
    return {
      success: false,
      error: formatZodError(parsed.error),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
