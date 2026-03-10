"use client";

import { ChevronDown, LayoutDashboard, Loader2, LogOut, Settings, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routing";
import { useAccountSettings } from "@/hooks/useAccount";
import { useClickOutside } from "@/hooks/useClickOutside";
import { isAnonymousSession, signOut, useSession } from "@/lib/auth-client";
import Logo from "./Logo";

function getInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]?.[0]?.toUpperCase() ?? "U";
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "U";
}

interface AvatarProps {
  name: string;
  imageUrl: string | null | undefined;
}

function Avatar({ name, imageUrl }: AvatarProps): React.JSX.Element {
  if (imageUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: Avatar URLs are user-provided and can come from arbitrary providers.
      <img src={imageUrl} alt={`${name} avatar`} className="size-9 rounded-full border border-slate-200 object-cover" />
    );
  }

  return (
    <span className="inline-flex size-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 font-semibold text-slate-700 text-sm">
      {getInitials(name)}
    </span>
  );
}

function normalizePath(path: string): string {
  if (path !== "/" && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

/**
 * Main navigation bar component for authenticated workspace routes.
 * Displays logo and user account controls with profile dropdown actions.
 */
export default function Navbar(): React.JSX.Element {
  const { data: session } = useSession();
  const isAnonymous = isAnonymousSession(session);
  const { data: accountSettings, isLoading } = useAccountSettings({
    enabled: !isAnonymous,
  });
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const displayName = useMemo(() => {
    if (isAnonymous) {
      return "Guest";
    }

    return accountSettings?.user.name || session?.user.name || session?.user.email || "User";
  }, [accountSettings?.user.name, isAnonymous, session?.user.email, session?.user.name]);

  const displayEmail = isAnonymous ? "" : accountSettings?.user.email || session?.user.email || "";
  const avatarUrl = accountSettings?.user.image ?? session?.user.image;
  const isAdmin = !isAnonymous && accountSettings?.user.role === "ADMIN";

  async function onLogout(): Promise<void> {
    try {
      await signOut();
      router.push(ROUTES.HOME);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  function onNavigateFromDropdown(event: React.MouseEvent<HTMLAnchorElement>, targetHref: string): void {
    const currentPath = normalizePath(pathname ?? "");
    const nextPath = normalizePath(targetHref);

    if (currentPath === nextPath) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
  }

  return (
    <div className="bg-white shadow">
      <nav className="mx-auto flex max-w-400 items-center justify-between px-4 py-4 text-slate-800 transition-all sm:px-6 lg:px-8">
        <Logo />

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm transition-all hover:bg-slate-50"
          >
            <Avatar name={displayName} imageUrl={avatarUrl} />
            <span className="hidden max-w-32 truncate font-medium text-slate-700 sm:inline">{displayName}</span>
            <ChevronDown className="size-4 text-slate-500" />
          </button>

          {isOpen && (
            <div
              className="absolute top-12 right-0 z-50 w-76 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
              role="menu"
            >
              <div className="mb-2 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={displayName} imageUrl={avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 text-sm">{displayName}</p>
                    <p className="truncate text-slate-500 text-xs">{displayEmail}</p>
                  </div>
                </div>
              </div>

              <div className="mb-1 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary-700" />
                  <p className="font-medium text-primary-900 text-sm">AI Credits</p>
                </div>
                <p className="font-semibold text-primary-800 text-sm">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading
                    </span>
                  ) : (
                    `${accountSettings?.credits.remaining ?? 0} / ${accountSettings?.credits.dailyLimit ?? 100}`
                  )}
                </p>
              </div>

              <Link
                href={ROUTES.WORKSPACE}
                onClick={(event) => onNavigateFromDropdown(event, ROUTES.WORKSPACE)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-slate-700 text-sm transition-colors hover:bg-slate-100"
              >
                <LayoutDashboard className="size-4" />
                Workspace
              </Link>

              <Link
                href={ROUTES.SETTINGS}
                onClick={(event) => onNavigateFromDropdown(event, ROUTES.SETTINGS)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-slate-700 text-sm transition-colors hover:bg-slate-100"
              >
                <Settings className="size-4" />
                Settings
              </Link>

              {isAdmin && (
                <Link
                  href={ROUTES.ADMIN}
                  onClick={(event) => onNavigateFromDropdown(event, ROUTES.ADMIN)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-slate-700 text-sm transition-colors hover:bg-slate-100"
                >
                  <ShieldCheck className="size-4" />
                  Admin page
                </Link>
              )}

              <button
                type="button"
                onClick={() => void onLogout()}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-red-600 text-sm transition-colors hover:bg-red-50"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
