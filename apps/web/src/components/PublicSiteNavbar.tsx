"use client";

import { Skeleton } from "@rezumerai/ui";
import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/constants/routing";
import { useSession } from "@/lib/auth-client";
import Logo from "./Logo";

interface PublicSiteNavbarProps {
  primaryCtaLabel: string;
}

const menuItems = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Features", href: `${ROUTES.HOME}#features` },
  { label: "How it works", href: `${ROUTES.HOME}#how-it-works` },
  { label: "FAQ", href: ROUTES.FAQ },
  { label: "Contact", href: ROUTES.CONTACT },
] as const;

export default function PublicSiteNavbar({ primaryCtaLabel }: PublicSiteNavbarProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();

  return (
    <>
      <nav className="z-50 flex w-full items-center justify-between px-6 py-4 text-sm md:px-16 lg:px-24 xl:px-40">
        <Logo />

        <div className="hidden items-center gap-8 text-slate-800 transition duration-500 md:flex">
          {menuItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-primary-600">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          {isPending && <Skeleton width={80} height={28} borderRadius={14} />}
          {!isPending && session && (
            <Link
              href={ROUTES.WORKSPACE}
              className="hidden rounded-full bg-primary-500 px-6 py-2 text-white transition-all hover:bg-primary-700 active:scale-95 md:block"
            >
              Workspace
            </Link>
          )}
          {!isPending && !session && (
            <>
              <Link
                href={ROUTES.SIGNUP}
                className="hidden rounded-full bg-primary-500 px-6 py-2 text-white transition-all hover:bg-primary-700 active:scale-95 md:block"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href={ROUTES.SIGNIN}
                className="hidden rounded-full border px-6 py-2 text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 md:block"
              >
                Login
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-90 md:hidden"
          aria-label="Open mobile menu"
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="lucide lucide-menu"
            aria-hidden="true"
          >
            <title>Menu</title>
            <path d="M4 5h16M4 12h16M4 19h16" />
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div
          id="public-mobile-menu"
          className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-8 bg-black/40 text-black text-lg backdrop-blur transition-opacity duration-300 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <nav aria-label="Mobile navigation">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block py-3 text-center text-2xl text-white transition-colors hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex aspect-square size-10 items-center justify-center rounded-md bg-primary-600 p-1 text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent active:ring-3 active:ring-white"
            aria-label="Close mobile menu"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </>
  );
}
