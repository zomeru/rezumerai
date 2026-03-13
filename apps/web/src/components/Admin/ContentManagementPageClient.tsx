"use client";

import type { ContentPage, FaqInformation, LandingPageInformation } from "@rezumerai/types";
import { AlertCircle } from "lucide-react";
import { ROUTES } from "@/constants/routing";
import { AdminEmptyState, AdminPageShell, AdminPanel } from "./AdminUI";
import ContentMetadataPanel from "./content/ContentMetadataPanel";
import ContentPageEditor from "./content/ContentPageEditor";
import FaqContentEditor from "./content/FaqContentEditor";
import { useContentManagementController } from "./content/hooks/useContentManagementController";
import LandingPageContentEditor from "./content/LandingPageContentEditor";
import RawJsonEditorPanel from "./content/RawJsonEditorPanel";
import TopicNavigator from "./content/TopicNavigator";

function StructuredEditor({
  schemaFamily,
  value,
  onChange,
}: {
  schemaFamily: "LANDING_PAGE" | "FAQ" | "CONTENT_PAGE";
  value: ContentPage | FaqInformation | LandingPageInformation;
  onChange: (nextValue: ContentPage | FaqInformation | LandingPageInformation) => void;
}): React.JSX.Element {
  if (schemaFamily === "LANDING_PAGE") {
    return <LandingPageContentEditor value={value as LandingPageInformation} onChange={onChange} />;
  }

  if (schemaFamily === "FAQ") {
    return <FaqContentEditor value={value as FaqInformation} onChange={onChange} />;
  }

  return <ContentPageEditor value={value as ContentPage} onChange={onChange} />;
}

export default function ContentManagementPageClient(): React.JSX.Element {
  const {
    entries,
    error,
    isDirtyByTopic,
    isFetching,
    isLoading,
    isSaving,
    isSaveDisabled,
    isSelectedDirty,
    mode,
    rawError,
    rawValue,
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
  } = useContentManagementController();

  return (
    <AdminPageShell
      title="Content Management"
      description="Manage public landing, FAQ, policy, and support content with structured editing first and raw JSON as a fallback."
      backHref={ROUTES.ADMIN}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load content settings</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <AdminPanel>
            <div className="h-80 animate-pulse rounded bg-slate-200" />
          </AdminPanel>
          <AdminPanel>
            <div className="h-80 animate-pulse rounded bg-slate-200" />
          </AdminPanel>
          <AdminPanel>
            <div className="h-80 animate-pulse rounded bg-slate-200" />
          </AdminPanel>
        </div>
      ) : !entries.length || !selectedEntry || !selectedDraft ? (
        <AdminEmptyState
          title="No public content entries found"
          description="Seed the public content system configuration entries to manage them here."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <TopicNavigator
            entries={entries}
            isDirtyByTopic={isDirtyByTopic}
            selectedTopic={selectedTopic}
            onSelect={setSelectedTopic}
          />

          <div>
            {mode === "STRUCTURED" ? (
              <StructuredEditor
                schemaFamily={selectedEntry.metadata.schemaFamily}
                value={selectedDraft}
                onChange={(nextValue) => updateSelectedDraft(() => nextValue)}
              />
            ) : (
              <RawJsonEditorPanel
                error={rawError}
                onChange={updateSelectedRawDraft}
                onFormat={formatSelectedRawDraft}
                value={rawValue}
              />
            )}
          </div>

          <ContentMetadataPanel
            entry={selectedEntry}
            isDirty={isSelectedDirty}
            isSaving={isSaving}
            isSaveDisabled={isSaveDisabled}
            mode={mode}
            onModeChange={setMode}
            onReset={resetSelectedDraft}
            onSave={() => void saveSelectedDraft()}
          />
        </div>
      )}
    </AdminPageShell>
  );
}
