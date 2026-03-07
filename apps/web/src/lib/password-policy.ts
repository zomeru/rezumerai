import { PASSWORD_CHANGE_COOLDOWN_DAYS, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@rezumerai/types";

export const CREDENTIAL_PROVIDER_IDS = new Set<string>(["credential", "email-password"]);

const PASSWORD_CHANGE_COOLDOWN_MS = PASSWORD_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const PASSWORD_REQUIREMENTS_TEXT = `${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`;

export interface PasswordManagementState {
  hasCredentialProvider: boolean;
  isOAuthOnly: boolean;
  isCooldownActive: boolean;
  lastChangedAt: string | null;
  nextAllowedAt: string | null;
  cooldownMessage: string | null;
}

export function isCredentialProvider(providerId: string): boolean {
  return CREDENTIAL_PROVIDER_IDS.has(providerId);
}

export function formatPasswordCooldownDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(date);
}

export function formatPasswordCooldownMessage(nextAllowedAt: Date): string {
  return `Password changes are limited to once every ${PASSWORD_CHANGE_COOLDOWN_DAYS} days. You can change it again on ${formatPasswordCooldownDate(nextAllowedAt)}.`;
}

export function getPasswordManagementState(options: {
  hasCredentialProvider: boolean;
  isOAuthOnly: boolean;
  lastPasswordChangeAt: Date | null;
  now?: Date;
}): PasswordManagementState {
  const now = options.now ?? new Date();
  const nextAllowedDate = options.lastPasswordChangeAt
    ? new Date(options.lastPasswordChangeAt.getTime() + PASSWORD_CHANGE_COOLDOWN_MS)
    : null;
  const isCooldownActive = nextAllowedDate !== null && nextAllowedDate.getTime() > now.getTime();

  return {
    hasCredentialProvider: options.hasCredentialProvider,
    isOAuthOnly: options.isOAuthOnly,
    isCooldownActive,
    lastChangedAt: options.lastPasswordChangeAt?.toISOString() ?? null,
    nextAllowedAt: nextAllowedDate?.toISOString() ?? null,
    cooldownMessage: isCooldownActive && nextAllowedDate ? formatPasswordCooldownMessage(nextAllowedDate) : null,
  };
}
