"use client";

import type { PublicContentTopic } from "@rezumerai/types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSystemConfigurations, useUpdateSystemConfiguration } from "@/hooks/useAdmin";
import {
  type AdminContentDraftValue,
  areAdminContentValuesEqual,
  createInitialDraftMap,
  formatAdminContentJson,
  getAdminContentEntries,
  parseAdminContentRawJson,
  validateAdminContentValue,
} from "../utils";

export type ContentManagementEditorMode = "STRUCTURED" | "RAW_JSON";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useContentManagementController() {
  const { data, error, isLoading, isFetching, refetch } = useSystemConfigurations();
  const updateConfiguration = useUpdateSystemConfiguration();
  const entries = useMemo(() => getAdminContentEntries(data), [data]);
  const [selectedTopic, setSelectedTopic] = useState<PublicContentTopic>("landing");
  const [mode, setMode] = useState<ContentManagementEditorMode>("STRUCTURED");
  const [persistedDrafts, setPersistedDrafts] = useState(() => createInitialDraftMap(entries));
  const [drafts, setDrafts] = useState(() => createInitialDraftMap(entries));
  const [rawDrafts, setRawDrafts] = useState<Partial<Record<PublicContentTopic, string>>>({});
  const [rawErrors, setRawErrors] = useState<Partial<Record<PublicContentTopic, string | null>>>({});

  useEffect(() => {
    if (!entries.length) {
      return;
    }

    const [firstEntry] = entries;

    if (!firstEntry) {
      return;
    }

    setSelectedTopic((currentTopic) =>
      entries.some((entry) => entry.metadata.topic === currentTopic) ? currentTopic : firstEntry.metadata.topic,
    );

    setPersistedDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      for (const entry of entries) {
        nextDrafts[entry.metadata.topic] = entry.value as AdminContentDraftValue;
      }

      return nextDrafts;
    });

    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      for (const entry of entries) {
        if (!nextDrafts[entry.metadata.topic]) {
          nextDrafts[entry.metadata.topic] = entry.value as AdminContentDraftValue;
        }
      }

      return nextDrafts;
    });

    setRawDrafts((currentRawDrafts) => {
      const nextRawDrafts = { ...currentRawDrafts };

      for (const entry of entries) {
        if (!nextRawDrafts[entry.metadata.topic]) {
          nextRawDrafts[entry.metadata.topic] = formatAdminContentJson(entry.value as AdminContentDraftValue);
        }
      }

      return nextRawDrafts;
    });
  }, [entries]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.metadata.topic === selectedTopic) ?? entries[0] ?? null,
    [entries, selectedTopic],
  );

  const dirtyTopics = useMemo(() => {
    return entries.reduce<Partial<Record<PublicContentTopic, boolean>>>((accumulator, entry) => {
      const topic = entry.metadata.topic;

      if (rawErrors[topic]) {
        accumulator[topic] =
          (rawDrafts[topic] ?? "") !==
          formatAdminContentJson((persistedDrafts[topic] ?? entry.value) as AdminContentDraftValue);
        return accumulator;
      }

      accumulator[topic] = !areAdminContentValuesEqual(drafts[topic], persistedDrafts[topic]);
      return accumulator;
    }, {});
  }, [drafts, entries, persistedDrafts, rawDrafts, rawErrors]);

  const selectedDraft = selectedEntry ? (drafts[selectedEntry.metadata.topic] ?? null) : null;
  const selectedRawDraft = selectedEntry ? (rawDrafts[selectedEntry.metadata.topic] ?? "") : "";
  const selectedRawError = selectedEntry ? (rawErrors[selectedEntry.metadata.topic] ?? null) : null;
  const isSelectedDirty = selectedEntry ? Boolean(dirtyTopics[selectedEntry.metadata.topic]) : false;
  const isSaveDisabled = !isSelectedDirty || Boolean(selectedRawError) || updateConfiguration.isPending;

  function updateSelectedDraft(updater: (currentDraft: AdminContentDraftValue) => AdminContentDraftValue): void {
    if (!selectedEntry) {
      return;
    }

    const topic = selectedEntry.metadata.topic;
    const fallbackDraft = (drafts[topic] ?? selectedEntry.value) as AdminContentDraftValue;

    setDrafts((currentDrafts) => {
      const nextDraft = updater((currentDrafts[topic] ?? fallbackDraft) as AdminContentDraftValue);

      setRawDrafts((currentRawDrafts) => ({
        ...currentRawDrafts,
        [topic]: formatAdminContentJson(nextDraft),
      }));
      setRawErrors((currentRawErrors) => ({
        ...currentRawErrors,
        [topic]: null,
      }));

      return {
        ...currentDrafts,
        [topic]: nextDraft,
      };
    });
  }

  function resetSelectedDraft(): void {
    if (!selectedEntry) {
      return;
    }

    const topic = selectedEntry.metadata.topic;
    const persistedValue = (persistedDrafts[topic] ?? selectedEntry.value) as AdminContentDraftValue;

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [topic]: persistedValue,
    }));
    setRawDrafts((currentRawDrafts) => ({
      ...currentRawDrafts,
      [topic]: formatAdminContentJson(persistedValue),
    }));
    setRawErrors((currentRawErrors) => ({
      ...currentRawErrors,
      [topic]: null,
    }));
  }

  function updateSelectedRawDraft(nextValue: string): void {
    if (!selectedEntry) {
      return;
    }

    const topic = selectedEntry.metadata.topic;

    setRawDrafts((currentRawDrafts) => ({
      ...currentRawDrafts,
      [topic]: nextValue,
    }));

    const parsedJson = parseAdminContentRawJson(nextValue);

    if (!parsedJson.success) {
      setRawErrors((currentRawErrors) => ({
        ...currentRawErrors,
        [topic]: parsedJson.error,
      }));
      return;
    }

    const validatedValue = validateAdminContentValue(topic, parsedJson.data);

    if (!validatedValue.success) {
      setRawErrors((currentRawErrors) => ({
        ...currentRawErrors,
        [topic]: validatedValue.error,
      }));
      return;
    }

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [topic]: validatedValue.data,
    }));
    setRawErrors((currentRawErrors) => ({
      ...currentRawErrors,
      [topic]: null,
    }));
  }

  function formatSelectedRawDraft(): void {
    if (!selectedEntry) {
      return;
    }

    const topic = selectedEntry.metadata.topic;
    const currentRawDraft = rawDrafts[topic] ?? "";
    const parsedJson = parseAdminContentRawJson(currentRawDraft);

    if (!parsedJson.success) {
      setRawErrors((currentRawErrors) => ({
        ...currentRawErrors,
        [topic]: parsedJson.error,
      }));
      return;
    }

    setRawDrafts((currentRawDrafts) => ({
      ...currentRawDrafts,
      [topic]: JSON.stringify(parsedJson.data, null, 2),
    }));

    const validatedValue = validateAdminContentValue(topic, parsedJson.data);

    if (!validatedValue.success) {
      setRawErrors((currentRawErrors) => ({
        ...currentRawErrors,
        [topic]: validatedValue.error,
      }));
      return;
    }

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [topic]: validatedValue.data,
    }));
    setRawErrors((currentRawErrors) => ({
      ...currentRawErrors,
      [topic]: null,
    }));
  }

  async function saveSelectedDraft(): Promise<void> {
    if (!selectedEntry) {
      return;
    }

    try {
      const topic = selectedEntry.metadata.topic;
      let nextDraftValue: AdminContentDraftValue;

      if (mode === "RAW_JSON") {
        const parsedJson = parseAdminContentRawJson(rawDrafts[topic] ?? "");

        if (!parsedJson.success) {
          setRawErrors((currentRawErrors) => ({
            ...currentRawErrors,
            [topic]: parsedJson.error,
          }));
          toast.error(parsedJson.error);
          return;
        }

        const validatedValue = validateAdminContentValue(topic, parsedJson.data);

        if (!validatedValue.success) {
          setRawErrors((currentRawErrors) => ({
            ...currentRawErrors,
            [topic]: validatedValue.error,
          }));
          toast.error(validatedValue.error);
          return;
        }

        nextDraftValue = validatedValue.data;
      } else if (selectedDraft) {
        nextDraftValue = selectedDraft;
      } else {
        return;
      }

      const updatedEntry = await updateConfiguration.mutateAsync({
        name: selectedEntry.name,
        value: nextDraftValue,
      });
      const nextValue = updatedEntry.value as AdminContentDraftValue;

      setPersistedDrafts((currentDrafts) => ({
        ...currentDrafts,
        [topic]: nextValue,
      }));
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [topic]: nextValue,
      }));
      setRawDrafts((currentRawDrafts) => ({
        ...currentRawDrafts,
        [topic]: formatAdminContentJson(nextValue),
      }));
      setRawErrors((currentRawErrors) => ({
        ...currentRawErrors,
        [topic]: null,
      }));
      toast.success(`${selectedEntry.metadata.label} updated.`);
    } catch (saveError: unknown) {
      toast.error(getErrorMessage(saveError, "Failed to update content."));
    }
  }

  return {
    data,
    entries,
    error,
    isDirtyByTopic: dirtyTopics,
    isFetching,
    isLoading,
    isSaving: updateConfiguration.isPending,
    isSaveDisabled,
    isSelectedDirty,
    mode,
    rawError: selectedRawError,
    rawValue: selectedRawDraft,
    formatSelectedRawDraft,
    refetch,
    resetSelectedDraft,
    saveSelectedDraft,
    selectedDraft,
    selectedEntry,
    selectedTopic,
    setMode,
    setSelectedTopic,
    updateSelectedDraft,
    updateSelectedRawDraft,
  };
}
