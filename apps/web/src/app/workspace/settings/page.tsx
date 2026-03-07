"use client";

import type { UpdateUserAccountInput, UserAccountSettings } from "@rezumerai/types";
import { capitalize } from "@rezumerai/utils/string";
import { ArrowLeft, Loader2, Lock, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Select";
import { ERROR_MESSAGES } from "@/constants/errors";
import { ROUTES } from "@/constants/routing";
import { useAccountSettings, useUpdateAccountSettings } from "@/hooks/useAccount";
import { useAiSettings, useUpdateSelectedAiModel } from "@/hooks/useAi";

interface AccountFormState {
  name: string;
  email: string;
  image: string;
}

function getProviderLabel(providerId: string): string {
  if (providerId === "credential" || providerId === "email-password") {
    return "Email and password";
  }

  return capitalize(providerId.replaceAll("-", " "));
}

function toFormState(settings: UserAccountSettings): AccountFormState {
  return {
    name: settings.user.name,
    email: settings.user.email,
    image: settings.user.image ?? "",
  };
}

function hasFormUpdates(settings: UserAccountSettings, formState: AccountFormState): boolean {
  const normalizedName = formState.name.trim();
  const normalizedEmail = formState.email.trim().toLowerCase();
  const normalizedImage = formState.image.trim() || null;

  if (normalizedName !== settings.user.name) {
    return true;
  }

  if (settings.permissions.canEditEmail && normalizedEmail !== settings.user.email.toLowerCase()) {
    return true;
  }

  if (normalizedImage !== (settings.user.image ?? null)) {
    return true;
  }

  return false;
}

function createAccountUpdates(settings: UserAccountSettings, formState: AccountFormState): UpdateUserAccountInput {
  const updates: UpdateUserAccountInput = {};

  const normalizedName = formState.name.trim();
  if (normalizedName !== settings.user.name) {
    updates.name = normalizedName;
  }

  if (settings.permissions.canEditEmail) {
    const normalizedEmail = formState.email.trim().toLowerCase();
    if (normalizedEmail !== settings.user.email.toLowerCase()) {
      updates.email = normalizedEmail;
    }
  }

  const normalizedImage = formState.image.trim() || null;
  if (normalizedImage !== (settings.user.image ?? null)) {
    updates.image = normalizedImage;
  }

  return updates;
}

export default function WorkspaceSettingsPage(): React.JSX.Element {
  const { data, error, isLoading, refetch } = useAccountSettings();
  const {
    data: aiSettings,
    error: aiSettingsError,
    isLoading: isAiSettingsLoading,
    refetch: refetchAiSettings,
  } = useAiSettings();
  const updateAccountSettings = useUpdateAccountSettings();
  const updateSelectedModel = useUpdateSelectedAiModel();

  const [formState, setFormState] = useState<AccountFormState>({
    name: "",
    email: "",
    image: "",
  });
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  useEffect(() => {
    if (!data) return;
    setFormState(toFormState(data));
  }, [data]);

  useEffect(() => {
    if (!aiSettings) return;
    setSelectedModelId(aiSettings.selectedModelId);
  }, [aiSettings]);

  const isDirty = useMemo(() => {
    if (!data) return false;
    return hasFormUpdates(data, formState);
  }, [data, formState]);

  const isModelSelectionDirty = useMemo(() => {
    if (!aiSettings) return false;
    return selectedModelId !== aiSettings.selectedModelId;
  }, [aiSettings, selectedModelId]);

  const modelOptions = useMemo(() => {
    if (!aiSettings) return [];

    return aiSettings.models.map((model) => ({
      value: model.modelId,
      label: `${model.providerDisplayName} — ${model.name}`,
    }));
  }, [aiSettings]);

  function updateField<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]): void {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!data) return;

    const updates = createAccountUpdates(data, formState);
    if (Object.keys(updates).length === 0) {
      toast.info("No profile changes to save.");
      return;
    }

    try {
      const updatedSettings = await updateAccountSettings.mutateAsync(updates);
      setFormState(toFormState(updatedSettings));
      toast.success("Account settings updated.");
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : "Failed to update account settings.";
      toast.error(message);
    }
  }

  async function onSaveSelectedModel(): Promise<void> {
    if (!selectedModelId || !aiSettings) return;

    try {
      const updatedSettings = await updateSelectedModel.mutateAsync(selectedModelId);
      setSelectedModelId(updatedSettings.selectedModelId);
      toast.success(ERROR_MESSAGES.AI_MODEL_PREFERENCE_SAVED);
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : ERROR_MESSAGES.AI_MODEL_PREFERENCE_UPDATE_FAILED;
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-400 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mb-8 h-10 w-72 animate-pulse rounded bg-slate-200" />
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-12 animate-pulse rounded bg-slate-200" />
            <div className="h-12 animate-pulse rounded bg-slate-200" />
            <div className="h-12 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-32 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!data || error) {
    return (
      <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-400 px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={ROUTES.WORKSPACE}
            className="mb-6 inline-flex items-center gap-2 text-slate-600 text-sm transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            Back to workspace
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-800 text-xl">Unable to load account settings</h2>
            <p className="mt-2 text-red-700">{error?.message ?? "Please try again."}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const emailReadOnly = !data.permissions.canEditEmail;

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-400 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.WORKSPACE}
          className="mb-6 inline-flex items-center gap-2 text-slate-600 text-sm transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back to workspace
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
              Account Settings
            </h1>
            <p className="mt-2 text-slate-600">Manage your profile information and sign-in settings.</p>
          </div>

          <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-right">
            <p className="font-medium text-primary-900 text-sm">AI credits remaining</p>
            <p className="font-bold text-primary-700 text-xl">
              {data.credits.remaining}
              <span className="font-medium text-base text-primary-600"> / {data.credits.dailyLimit}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {data.providers.map((provider) => (
              <span
                key={provider.providerId}
                className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 font-medium text-slate-700 text-xs"
              >
                {getProviderLabel(provider.providerId)}
              </span>
            ))}
          </div>

          <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
            <div>
              <label htmlFor="account-name" className="mb-1.5 block font-medium text-slate-700 text-sm">
                Name
              </label>
              <input
                id="account-name"
                type="text"
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>

            <div>
              <label htmlFor="account-email" className="mb-1.5 block font-medium text-slate-700 text-sm">
                Email
              </label>
              <input
                id="account-email"
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                disabled={emailReadOnly}
                required
              />
              {emailReadOnly && data.readOnlyReasons.email && (
                <p className="mt-1.5 text-slate-500 text-xs">{data.readOnlyReasons.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="account-image" className="mb-1.5 block font-medium text-slate-700 text-sm">
                Profile image URL
              </label>
              <input
                id="account-image"
                type="url"
                value={formState.image}
                onChange={(event) => updateField("image", event.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label htmlFor="account-password" className="mb-1.5 block font-medium text-slate-700 text-sm">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="account-password"
                  type="password"
                  value="********"
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 py-2.5 pr-4 pl-9 text-slate-500 text-sm"
                  disabled
                  readOnly
                />
              </div>
              {data.readOnlyReasons.password && (
                <p className="mt-1.5 text-slate-500 text-xs">{data.readOnlyReasons.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={updateAccountSettings.isPending || !isDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-5 py-2.5 font-semibold text-sm text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {updateAccountSettings.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save changes
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900 text-xl">AI Settings</h2>
            <p className="mt-1 text-slate-600 text-sm">Choose the default AI model used for your optimization flow.</p>
          </div>

          {isAiSettingsLoading && (
            <div className="space-y-3">
              <div className="h-11 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-36 animate-pulse rounded bg-slate-200" />
            </div>
          )}

          {!isAiSettingsLoading && aiSettingsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-800 text-sm">{ERROR_MESSAGES.AI_SETTINGS_LOAD_FAILED}</p>
              <p className="mt-1 text-red-700 text-xs">{aiSettingsError.message}</p>
              <button
                type="button"
                onClick={() => void refetchAiSettings()}
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 font-medium text-red-700 text-xs transition-colors hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {!isAiSettingsLoading && aiSettings && (
            <div className="space-y-6">
              <div>
                <Select
                  label="Default AI model"
                  value={selectedModelId}
                  onChange={(nextValue) => setSelectedModelId(nextValue)}
                  options={modelOptions}
                  placeholder={ERROR_MESSAGES.AI_NO_ACTIVE_MODELS}
                  disabled={!aiSettings.models.length || updateSelectedModel.isPending}
                />
                {Boolean(aiSettings.models.length) && (
                  <p className="mt-1.5 text-slate-500 text-xs">Only active models are available for selection.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void onSaveSelectedModel()}
                disabled={updateSelectedModel.isPending || !isModelSelectionDirty || !selectedModelId}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-5 py-2.5 font-semibold text-sm text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {updateSelectedModel.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save model
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
