"use client";

import { type AdminUserPasswordUpdateInput, AdminUserPasswordUpdateInputSchema } from "@rezumerai/types";
import { AlertCircle, ArrowLeft, Loader2, Save, ShieldAlert, UserCog } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routing";
import { useAdminUserDetail, useUpdateAdminUserPassword, useUpdateAdminUserRole } from "@/hooks/useAdmin";
import { PASSWORD_REQUIREMENTS_TEXT } from "@/lib/password-policy";
import {
  AdminBadge,
  AdminEmptyState,
  AdminFieldLabel,
  AdminInput,
  AdminPageShell,
  AdminPanel,
  AdminSelect,
  AdminTableWrapper,
} from "./AdminUI";
import { formatDateTime } from "./format";

const ROLE_OPTIONS = ["ADMIN", "USER"] as const;

interface PasswordFormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function UserDetailPageClient({ userId }: { userId: string }): React.JSX.Element {
  const { data, error, isLoading } = useAdminUserDetail(userId);
  const updateRole = useUpdateAdminUserRole();
  const updatePassword = useUpdateAdminUserPassword();
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]>("USER");
  const [passwordForm, setPasswordForm] = useState<AdminUserPasswordUpdateInput>({
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({});

  useEffect(() => {
    if (data) {
      setSelectedRole(data.role);
    }
  }, [data]);

  const isRoleDirty = useMemo(() => (data ? selectedRole !== data.role : false), [data, selectedRole]);

  async function onSaveRole(): Promise<void> {
    if (!data || !isRoleDirty) {
      return;
    }

    try {
      await updateRole.mutateAsync({ userId: data.id, role: selectedRole });
      toast.success("User role updated.");
    } catch (mutationError: unknown) {
      toast.error(mutationError instanceof Error ? mutationError.message : "Failed to update user role.");
    }
  }

  async function onSavePassword(): Promise<void> {
    if (!data) {
      return;
    }

    const parsed = AdminUserPasswordUpdateInputSchema.safeParse(passwordForm);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setPasswordErrors({
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }

    setPasswordErrors({});

    try {
      await updatePassword.mutateAsync({
        userId: data.id,
        input: parsed.data,
      });
      setPasswordForm({
        password: "",
        confirmPassword: "",
      });
      toast.success("User password updated.");
    } catch (mutationError: unknown) {
      toast.error(mutationError instanceof Error ? mutationError.message : "Failed to update user password.");
    }
  }

  return (
    <AdminPageShell
      title="User Detail"
      description="Inspect account context, recent admin-relevant activity, and safe role controls for this user."
      action={
        <Link
          href={ROUTES.ADMIN_USERS}
          className="inline-flex items-center gap-2 text-slate-600 text-sm transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      }
    >
      {isLoading ? (
        <AdminPanel>
          <div className="space-y-4">
            <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
            <div className="h-48 animate-pulse rounded bg-slate-200" />
          </div>
        </AdminPanel>
      ) : error || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Unable to load user details</p>
              <p className="mt-1 text-red-700 text-sm">{error?.message ?? "The requested user could not be found."}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_22rem]">
            <AdminPanel>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">Account Overview</p>
                  <h2 className="mt-2 font-bold text-3xl text-slate-900">{data.name}</h2>
                  <p className="mt-2 text-slate-600">{data.email}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminBadge tone={data.role === "ADMIN" ? "info" : "neutral"}>{data.role}</AdminBadge>
                    <AdminBadge tone="success">{data.status}</AdminBadge>
                    <AdminBadge tone={data.emailVerified ? "success" : "warning"}>
                      {data.emailVerified ? "Email verified" : "Email unverified"}
                    </AdminBadge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Resumes</p>
                    <p className="mt-1 font-semibold text-2xl text-slate-900">{data.resumeCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">AI Credits</p>
                    <p className="mt-1 font-semibold text-2xl text-slate-900">{data.credits.remaining}</p>
                    <p className="text-slate-500 text-xs">Daily limit {data.credits.dailyLimit}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Created</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(data.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Updated</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(data.updatedAt)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">User ID</p>
                  <p className="mt-1 break-all font-semibold text-slate-900">{data.id}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Status</p>
                  <p className="mt-1 font-semibold text-slate-900">{data.status}</p>
                </div>
              </div>
            </AdminPanel>

            <div className="space-y-6">
              <AdminPanel>
                <div className="flex items-center gap-2">
                  <UserCog className="size-5 text-primary-700" />
                  <h3 className="font-semibold text-slate-900 text-xl">Role Controls</h3>
                </div>

                <div className="mt-4 space-y-4">
                  <AdminSelect
                    label="Assigned role"
                    value={selectedRole}
                    onChange={(value) => {
                      if (value === "ADMIN" || value === "USER") {
                        setSelectedRole(value);
                      }
                    }}
                    options={ROLE_OPTIONS.map((role) => ({
                      value: role,
                      label: role,
                    }))}
                  />

                  <button
                    type="button"
                    onClick={() => void onSaveRole()}
                    disabled={!isRoleDirty || updateRole.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updateRole.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save role
                  </button>
                </div>
              </AdminPanel>

              <AdminPanel>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-primary-700" />
                  <h3 className="font-semibold text-slate-900 text-xl">Password Management</h3>
                </div>
                <p className="mt-3 text-slate-600 text-sm">
                  Set a new credential password for this user. If the account is OAuth-only, this will add a Better Auth
                  credential password without removing linked providers.
                </p>
                <p className="mt-2 text-slate-500 text-xs">Password must be {PASSWORD_REQUIREMENTS_TEXT}.</p>

                <div className="mt-4 space-y-4">
                  <AdminFieldLabel label="New password">
                    <AdminInput
                      type="password"
                      value={passwordForm.password}
                      onChange={(value) => {
                        setPasswordForm((current) => ({ ...current, password: value }));
                        setPasswordErrors((current) => ({ ...current, password: undefined }));
                      }}
                      className="w-full"
                    />
                    {passwordErrors.password ? <p className="text-red-600 text-xs">{passwordErrors.password}</p> : null}
                  </AdminFieldLabel>

                  <AdminFieldLabel label="Confirm new password">
                    <AdminInput
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(value) => {
                        setPasswordForm((current) => ({ ...current, confirmPassword: value }));
                        setPasswordErrors((current) => ({ ...current, confirmPassword: undefined }));
                      }}
                      className="w-full"
                    />
                    {passwordErrors.confirmPassword ? (
                      <p className="text-red-600 text-xs">{passwordErrors.confirmPassword}</p>
                    ) : null}
                  </AdminFieldLabel>

                  <button
                    type="button"
                    onClick={() => void onSavePassword()}
                    disabled={updatePassword.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-4 py-2.5 font-medium text-sm text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatePassword.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Update password
                  </button>
                </div>
              </AdminPanel>

              <AdminPanel>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-amber-600" />
                  <h3 className="font-semibold text-slate-900 text-xl">Account Status</h3>
                </div>
                <p className="mt-3 text-slate-600 text-sm">
                  Account disable and enable controls are not currently supported by the existing authentication
                  lifecycle, so this admin panel keeps status read-only to avoid introducing unsafe account mutations.
                </p>
              </AdminPanel>
            </div>
          </div>

          <AdminPanel>
            <h3 className="font-semibold text-slate-900 text-xl">Recent Activity</h3>
            <p className="mt-1 text-slate-500 text-sm">Recent user and system actions associated with this account.</p>

            {data.recentActivity.length === 0 ? (
              <div className="mt-4">
                <AdminEmptyState
                  title="No recent activity"
                  description="No recent audit-backed activity was found for this user."
                />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {activity.action} · {activity.resourceType}
                        </p>
                        <p className="text-slate-500 text-sm">{activity.eventType}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs">
                        <AdminBadge tone={activity.category === "DATABASE_CHANGE" ? "warning" : "info"}>
                          {activity.category.replaceAll("_", " ")}
                        </AdminBadge>
                        <span>{formatDateTime(activity.createdAt)}</span>
                      </div>
                    </div>
                    {activity.endpoint ? (
                      <p className="mt-2 text-slate-600 text-sm">
                        {activity.method ?? ""} {activity.endpoint}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>

          <AdminPanel>
            <h3 className="font-semibold text-slate-900 text-xl">Related Audit Logs</h3>
            <p className="mt-1 text-slate-500 text-sm">
              Audit entries directly tied to this user account or resource record.
            </p>

            {data.recentAuditLogs.length === 0 ? (
              <div className="mt-4">
                <AdminEmptyState
                  title="No related audit logs"
                  description="Audit log coverage is active, but no entries were linked to this user yet."
                />
              </div>
            ) : (
              <AdminTableWrapper>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-left">Resource</th>
                      <th className="px-4 py-3 text-left">Endpoint</th>
                      <th className="px-4 py-3 text-left">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentAuditLogs.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4">
                          <AdminBadge tone={item.category === "DATABASE_CHANGE" ? "warning" : "info"}>
                            {item.category}
                          </AdminBadge>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-900">{item.action}</td>
                        <td className="px-4 py-4 text-slate-600">{item.resourceType}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {item.endpoint ? `${item.method ?? ""} ${item.endpoint}` : "N/A"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrapper>
            )}
          </AdminPanel>
        </div>
      )}
    </AdminPageShell>
  );
}
