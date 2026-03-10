"use client";

import type { AdminAiModel, AdminAiProviderOption } from "@rezumerai/types";
import { cn } from "@rezumerai/utils/styles";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Select } from "@/components/ui/Select";
import { ROUTES } from "@/constants/routing";
import {
  useAdminAiModels,
  useCreateAdminAiModel,
  useDeleteAdminAiModel,
  useUpdateAdminAiModel,
} from "@/hooks/useAdmin";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  AdminBadge,
  AdminEmptyState,
  AdminFilterGrid,
  AdminInput,
  AdminPageShell,
  AdminPanel,
  AdminStatCard,
  AdminTableWrapper,
} from "./AdminUI";
import { formatDateTime } from "./format";

interface AiModelFormState {
  providerId: string;
  name: string;
  modelId: string;
  isActive: boolean;
}

interface AiModelEditorFormProps {
  editingModel: AdminAiModel | null;
  formState: AiModelFormState;
  providerOptions: Array<{ value: string; label: string }>;
  providers: AdminAiProviderOption[];
  isSubmitting: boolean;
  formError: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onProviderChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onModelIdChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onDismiss: () => void;
  dismissLabel: string;
}

interface AiModelEditorModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  { value: "inactive", label: "Inactive only" },
] as const;
const SKELETON_KEYS = [
  "ai-model-skeleton-1",
  "ai-model-skeleton-2",
  "ai-model-skeleton-3",
  "ai-model-skeleton-4",
] as const;
const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";
const EDITOR_MODAL_EXIT_ANIMATION_MS = 200;

function createEmptyFormState(providers: AdminAiProviderOption[]): AiModelFormState {
  return {
    providerId: providers[0]?.id ?? "",
    name: "",
    modelId: "",
    isActive: true,
  };
}

function toFormState(model: AdminAiModel): AiModelFormState {
  return {
    providerId: model.providerId,
    name: model.name,
    modelId: model.modelId,
    isActive: model.isActive,
  };
}

function matchesSearch(model: AdminAiModel, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [model.name, model.modelId, model.providerName].some((value) =>
    value.toLowerCase().includes(normalizedSearch),
  );
}

function useIsMobileViewport(): boolean {
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

    setIsMobileViewport(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent): void {
      setIsMobileViewport(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobileViewport;
}

function AiModelEditorForm({
  editingModel,
  formState,
  providerOptions,
  providers,
  isSubmitting,
  formError,
  onSubmit,
  onProviderChange,
  onNameChange,
  onModelIdChange,
  onActiveChange,
  onDismiss,
  dismissLabel,
}: AiModelEditorFormProps): React.JSX.Element {
  return (
    <>
      <div>
        <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">
          {editingModel ? "Edit Model" : "Create Model"}
        </p>
        <h2 className="mt-2 font-bold text-2xl text-slate-900">{editingModel ? editingModel.name : "New AI Model"}</h2>
        <p className="mt-2 text-slate-600 text-sm">
          Each model belongs to a provider. The provider plus model ID combination must stay unique.
        </p>
      </div>

      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-5">
        <Select
          label="Provider"
          value={formState.providerId}
          onChange={onProviderChange}
          options={providerOptions}
          placeholder={providers.length > 0 ? "Choose a provider" : "No providers available"}
          disabled={!providers.length || isSubmitting}
        />

        <div>
          <label htmlFor="ai-model-name" className="mb-1.5 block font-medium text-slate-700 text-sm">
            Model name
          </label>
          <input
            id="ai-model-name"
            type="text"
            value={formState.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="GPT-4.1 Mini"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label htmlFor="ai-model-id" className="mb-1.5 block font-medium text-slate-700 text-sm">
            Model ID
          </label>
          <input
            id="ai-model-id"
            type="text"
            value={formState.modelId}
            onChange={(event) => onModelIdChange(event.target.value)}
            placeholder="openai/gpt-4.1-mini"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            disabled={isSubmitting}
            required
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <input
            type="checkbox"
            checked={formState.isActive}
            onChange={(event) => onActiveChange(event.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            disabled={isSubmitting}
          />

          <div>
            <p className="font-medium text-slate-900 text-sm">Active model</p>
            <p className="mt-1 text-slate-500 text-sm">
              Active models can be selected by users. Inactive models stay stored for admin reference.
            </p>
          </div>
        </label>

        {formError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{formError}</div>
        ) : null}

        {!providers.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
            Add at least one AI provider in the database before creating models.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !providers.length}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
            {editingModel ? "Save changes" : "Create model"}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
          >
            {dismissLabel}
          </button>
        </div>
      </form>
    </>
  );
}

function AiModelEditorModal({
  isOpen,
  title,
  description,
  onClose,
  children,
}: AiModelEditorModalProps): React.JSX.Element | null {
  const [isMounted, setIsMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const frame = requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => {
      setIsRendered(false);
    }, EDITOR_MODAL_EXIT_ANIMATION_MS);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isRendered]);

  if (!isMounted || !isRendered) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-210 flex items-end justify-center p-4 transition-opacity duration-200 sm:items-center",
        isVisible ? "bg-slate-950/45 opacity-100 backdrop-blur-sm" : "bg-slate-950/0 opacity-0",
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl transition-all duration-200",
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-slate-200 border-b px-6 py-5">
          <div>
            <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">Mobile Editor</p>
            <h2 id={titleId} className="mt-2 font-bold text-2xl text-slate-900">
              {title}
            </h2>
            <p id={descriptionId} className="mt-2 text-slate-600 text-sm">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close model editor"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default function AiModelManagementPageClient(): React.JSX.Element {
  const { data, error, isLoading, isFetching, refetch } = useAdminAiModels();
  const createModel = useCreateAdminAiModel();
  const updateModel = useUpdateAdminAiModel();
  const deleteModel = useDeleteAdminAiModel();
  const isMobileViewport = useIsMobileViewport();

  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AiModelFormState>(createEmptyFormState([]));
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");
  const [pendingDeleteModel, setPendingDeleteModel] = useState<AdminAiModel | null>(null);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const [hasAutoSelectedInitialModel, setHasAutoSelectedInitialModel] = useState(false);

  const isSubmitting = createModel.isPending || updateModel.isPending;
  const providers = data?.providers ?? [];
  const models = data?.models ?? [];

  useEffect(() => {
    if (!data) {
      return;
    }

    if (!hasAutoSelectedInitialModel && !editingModelId && data.models.length > 0) {
      const firstModel = data.models[0];
      if (firstModel) {
        setEditingModelId(firstModel.id);
        setFormState(toFormState(firstModel));
        setFormError(null);
        setHasAutoSelectedInitialModel(true);
        return;
      }
    }

    if (editingModelId) {
      const model = data.models.find((item) => item.id === editingModelId);

      if (model) {
        setHasAutoSelectedInitialModel(true);
        setFormState(toFormState(model));
        return;
      }

      setEditingModelId(null);
      setFormState(createEmptyFormState(data.providers));
      setIsMobileEditorOpen(false);
      return;
    }

    setFormState((current) => {
      const providerStillExists = data.providers.some((provider) => provider.id === current.providerId);

      if (providerStillExists || current.name.trim() || current.modelId.trim()) {
        return current;
      }

      return createEmptyFormState(data.providers);
    });
  }, [data, editingModelId, hasAutoSelectedInitialModel]);

  useEffect(() => {
    if (!isMobileViewport) {
      setIsMobileEditorOpen(false);
    }
  }, [isMobileViewport]);

  const providerOptions = useMemo(() => {
    return providers.map((provider) => ({
      value: provider.id,
      label: provider.name,
    }));
  }, [providers]);

  const providerFilterOptions = useMemo(() => {
    return [{ value: "all", label: "All providers" }, ...providerOptions];
  }, [providerOptions]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (!matchesSearch(model, search)) {
        return false;
      }

      if (providerFilter !== "all" && model.providerId !== providerFilter) {
        return false;
      }

      if (statusFilter === "active" && !model.isActive) {
        return false;
      }

      if (statusFilter === "inactive" && model.isActive) {
        return false;
      }

      return true;
    });
  }, [models, providerFilter, search, statusFilter]);

  const activeModelCount = useMemo(() => models.filter((model) => model.isActive).length, [models]);

  const editingModel = useMemo(() => {
    if (!editingModelId) {
      return null;
    }

    return models.find((model) => model.id === editingModelId) ?? null;
  }, [editingModelId, models]);

  function closeMobileEditor(): void {
    setIsMobileEditorOpen(false);
    setFormError(null);
  }

  function resetFormToCreateMode(openInMobile = false): void {
    setEditingModelId(null);
    setFormState(createEmptyFormState(providers));
    setFormError(null);
    setIsMobileEditorOpen(openInMobile && isMobileViewport);
  }

  function startEditing(model: AdminAiModel, openInMobile = false): void {
    setEditingModelId(model.id);
    setFormState(toFormState(model));
    setFormError(null);
    setIsMobileEditorOpen(openInMobile && isMobileViewport);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const payload = {
      providerId: formState.providerId.trim(),
      name: formState.name.trim(),
      modelId: formState.modelId.trim(),
      isActive: formState.isActive,
    };

    if (!payload.providerId) {
      const message = "Select a provider before saving.";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (!payload.name) {
      const message = "Model name is required.";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (!payload.modelId) {
      const message = "Model ID is required.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      if (editingModelId) {
        const updated = await updateModel.mutateAsync({ id: editingModelId, input: payload });
        setEditingModelId(updated.id);
        setFormState(toFormState(updated));
        toast.success("AI model updated.");
      } else {
        const created = await createModel.mutateAsync(payload);
        setEditingModelId(created.id);
        setFormState(toFormState(created));
        toast.success("AI model created.");
      }

      if (isMobileViewport) {
        setIsMobileEditorOpen(false);
      }
    } catch (mutationError: unknown) {
      const message = mutationError instanceof Error ? mutationError.message : "Unable to save AI model.";
      setFormError(message);
      toast.error(message);
    }
  }

  async function onConfirmDelete(): Promise<void> {
    if (!pendingDeleteModel) {
      return;
    }

    try {
      await deleteModel.mutateAsync(pendingDeleteModel.id);

      if (pendingDeleteModel.id === editingModelId) {
        resetFormToCreateMode(false);
      }

      toast.success("AI model deleted.");
      setPendingDeleteModel(null);
    } catch (mutationError: unknown) {
      const message = mutationError instanceof Error ? mutationError.message : "Unable to delete AI model.";
      toast.error(message);
    }
  }

  function renderEditorForm(dismissLabel: string, onDismiss: () => void): React.JSX.Element {
    return (
      <AiModelEditorForm
        editingModel={editingModel}
        formState={formState}
        providerOptions={providerOptions}
        providers={providers}
        isSubmitting={isSubmitting}
        formError={formError}
        onSubmit={onSubmit}
        onProviderChange={(value) => {
          setFormState((current) => ({ ...current, providerId: value }));
          setFormError(null);
        }}
        onNameChange={(value) => {
          setFormState((current) => ({ ...current, name: value }));
          setFormError(null);
        }}
        onModelIdChange={(value) => {
          setFormState((current) => ({ ...current, modelId: value }));
          setFormError(null);
        }}
        onActiveChange={(value) => {
          setFormState((current) => ({ ...current, isActive: value }));
        }}
        onDismiss={onDismiss}
        dismissLabel={dismissLabel}
      />
    );
  }

  return (
    <AdminPageShell
      title="AI Models"
      description="Manage the AI models available across the platform, assign each model to a provider, and control which ones users can pick."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.ADMIN}
            className="inline-flex items-center gap-2 text-slate-600 text-sm transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            Back to admin
          </Link>

          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 text-sm shadow-sm transition-all hover:bg-slate-50"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => resetFormToCreateMode(isMobileViewport)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Plus className="size-4" />
            New model
          </button>
        </div>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load AI models</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <AdminStatCard
              title="Total Models"
              value={String(models.length)}
              caption="Stored AI model records"
              icon={Bot}
            />
            <AdminStatCard
              title="Active Models"
              value={String(activeModelCount)}
              caption="Available to users right now"
              icon={CheckCircle2}
            />
            <AdminStatCard
              title="Providers"
              value={String(providers.length)}
              caption="Configured AI providers"
              icon={Building2}
            />
          </div>

          <AdminFilterGrid className="md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1.5 block font-medium text-slate-700 text-sm" htmlFor="ai-model-search">
                Search models
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
                <AdminInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by name, model ID, or provider"
                  className="w-full pl-9"
                />
              </div>
            </div>

            <Select
              label="Provider filter"
              value={providerFilter}
              onChange={setProviderFilter}
              options={providerFilterOptions}
              placeholder="All providers"
              disabled={!providerFilterOptions.length}
            />

            <Select
              label="Status filter"
              value={statusFilter}
              onChange={(value) => {
                if (value === "all" || value === "active" || value === "inactive") {
                  setStatusFilter(value);
                }
              }}
              options={[...STATUS_FILTER_OPTIONS]}
              placeholder="All statuses"
            />
          </AdminFilterGrid>

          {isLoading ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
              <AdminPanel>
                <div className="space-y-4">
                  {SKELETON_KEYS.map((key) => (
                    <div key={key} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              </AdminPanel>
              <AdminPanel className="hidden md:block">
                <div className="space-y-4">
                  <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </AdminPanel>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
              <AdminPanel className="p-0">
                <div className="border-slate-200 border-b px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-900 text-xl">Model Catalog</h2>
                      <p className="mt-1 text-slate-500 text-sm">
                        Manage which provider-backed models are available to the rest of the system.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                      <p className="text-slate-500 text-xs uppercase tracking-wide">Visible rows</p>
                      <p className="mt-1 font-semibold text-2xl text-slate-900">{filteredModels.length}</p>
                    </div>
                  </div>
                </div>

                {filteredModels.length === 0 ? (
                  <div className="p-6">
                    <AdminEmptyState
                      title={models.length === 0 ? "No AI models configured yet" : "No AI models match these filters"}
                      description={
                        models.length === 0
                          ? "Create the first AI model entry here once at least one provider is available."
                          : "Try a different provider or status filter to find the model you need."
                      }
                    />
                  </div>
                ) : (
                  <AdminTableWrapper>
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                        <tr>
                          <th className="px-4 py-3 text-left">Model Name</th>
                          <th className="px-4 py-3 text-left">Model ID</th>
                          <th className="px-4 py-3 text-left">Provider</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Updated</th>
                          <th className="px-4 py-3 text-left">Created</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredModels.map((model) => {
                          const isEditing = model.id === editingModelId;

                          return (
                            <tr
                              key={model.id}
                              className={cn(
                                isEditing
                                  ? "border-primary-200 bg-primary-50/80 shadow-[inset_4px_0_0_0_rgba(37,99,235,0.95)]"
                                  : "hover:bg-slate-50",
                                "transition-colors",
                              )}
                            >
                              <td className={cn("px-4 py-4", isEditing && "relative pl-6")}>
                                {isEditing ? (
                                  <span className="absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-full bg-primary-600" />
                                ) : null}
                                <div className={cn("font-semibold text-slate-900", isEditing && "text-primary-950")}>
                                  {model.name}
                                </div>
                              </td>
                              <td
                                className={cn(
                                  "px-4 py-4 font-mono text-slate-600 text-xs",
                                  isEditing && "text-primary-900",
                                )}
                              >
                                {model.modelId}
                              </td>
                              <td className={cn("px-4 py-4 text-slate-600", isEditing && "text-primary-900")}>
                                {model.providerName}
                              </td>
                              <td className="px-4 py-4">
                                <AdminBadge tone={model.isActive ? "success" : "warning"}>
                                  {model.isActive ? "Active" : "Inactive"}
                                </AdminBadge>
                              </td>
                              <td className={cn("px-4 py-4 text-slate-600", isEditing && "text-primary-900")}>
                                {formatDateTime(model.updatedAt)}
                              </td>
                              <td className={cn("px-4 py-4 text-slate-600", isEditing && "text-primary-900")}>
                                {formatDateTime(model.createdAt)}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      startEditing(model, true);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setPendingDeleteModel(model);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 font-medium text-red-700 text-xs transition-colors hover:bg-red-100"
                                  >
                                    <Trash2 className="size-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </AdminTableWrapper>
                )}

                <div className="border-slate-200 border-t px-6 py-4 text-slate-500 text-sm md:hidden">
                  Use <span className="font-medium text-slate-700">New model</span> or a row's edit action to open the
                  mobile editor.
                </div>
              </AdminPanel>

              {!isMobileViewport ? (
                <AdminPanel>{renderEditorForm("Reset", () => resetFormToCreateMode(false))}</AdminPanel>
              ) : null}
            </div>
          )}
        </>
      )}

      <AiModelEditorModal
        isOpen={isMobileEditorOpen}
        title={editingModel ? `Edit ${editingModel.name}` : "Create AI Model"}
        description="Manage provider, model ID, and availability without leaving the catalog."
        onClose={closeMobileEditor}
      >
        {renderEditorForm("Cancel", closeMobileEditor)}
      </AiModelEditorModal>

      <ConfirmationModal
        isOpen={pendingDeleteModel !== null}
        title="Delete AI model?"
        description={
          pendingDeleteModel ? (
            <p>
              Remove <span className="font-semibold text-slate-900">{pendingDeleteModel.name}</span> from{" "}
              <span className="font-semibold text-slate-900">{pendingDeleteModel.providerName}</span>? Users with this
              model selected will be reset to another available model when needed.
            </p>
          ) : (
            "This action cannot be undone."
          )
        }
        confirmLabel="Delete model"
        cancelLabel="Keep model"
        isConfirming={deleteModel.isPending}
        onCancel={() => {
          if (!deleteModel.isPending) {
            setPendingDeleteModel(null);
          }
        }}
        onConfirm={onConfirmDelete}
      />
    </AdminPageShell>
  );
}
