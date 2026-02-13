"use client";

import { FileText, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/constants/routing";
import Logo from "../Logo";

interface MenuItem {
  label: string;
  href: string;
  id: string;
}

const menuItems: MenuItem[] = [
  { label: "Home", href: "#", id: "home" },
  { label: "Features", href: "#features", id: "features" },
  { label: "How it works", href: "#how-it-works", id: "how-it-works" },
  { label: "GitHub", href: "#github", id: "github" },
];

const SAMPLE_PREVIEW_RESUME_ID = "68d2a31a1c4dd38875bb037e";
const samplePreviewHref = `${ROUTES.PREVIEW}/${SAMPLE_PREVIEW_RESUME_ID}`;

/**
 * Hero section of the homepage, featuring the main headline, navigation bar, and call-to-action buttons.
 */
export default function Hero(): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div>
      {/* Navbar */}
      <nav className="z-50 flex w-full items-center justify-between px-6 py-4 text-sm md:px-16 lg:px-24 xl:px-40">
        <Logo />

        <div className="hidden items-center gap-8 text-slate-800 transition duration-500 md:flex">
          {menuItems.map(({ label, href, id }) => (
            <Link key={id} href={href} className="transition hover:text-primary-600">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          <Link
            href={ROUTES.SIGNUP}
            className="hidden rounded-full bg-primary-500 px-6 py-2 text-white transition-all hover:bg-primary-700 active:scale-95 md:block"
          >
            Get started
          </Link>
          <Link
            href={ROUTES.SIGNIN}
            className="hidden rounded-full border px-6 py-2 text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 md:block"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          onClick={(): void => setMenuOpen(true)}
          className="transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-90 md:hidden"
          aria-label="Open mobile menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
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

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-8 bg-black/40 text-black text-lg backdrop-blur transition-opacity duration-300 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <nav aria-label="Mobile navigation">
            {menuItems.map(({ label, href, id }) => (
              <Link
                key={id}
                href={href}
                className="block py-3 text-center text-2xl text-white transition-colors hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                onClick={(): void => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={(): void => setMenuOpen(false)}
            className="flex aspect-square size-10 items-center justify-center rounded-md bg-primary-600 p-1 text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent active:ring-3 active:ring-white"
            aria-label="Close mobile menu"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center px-4 text-black text-sm md:px-16 lg:px-24 xl:px-40">
        <div className="absolute top-28 left-1/4 -z-10 size-72 bg-primary-300 opacity-30 blur-[100px] sm:size-96 xl:top-10 xl:size-120 2xl:size-132"></div>

        {/* Context chips (honest, capability-based) */}
        <div className="mt-24 flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-slate-700 shadow-sm backdrop-blur">
          <span className="rounded-full bg-primary-100 px-2 py-0.5 font-semibold text-primary-700 text-xs">
            Early access
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Sparkles className="size-4 text-primary-600" /> AI suggestions
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Target className="size-4 text-primary-600" /> Tailor to job posts
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <FileText className="size-4 text-primary-600" /> Export a polished PDF
          </span>
        </div>

        {/* Headline + CTA */}
        <h1 className="mt-4 max-w-5xl text-center font-semibold text-5xl md:text-6xl md:leading-17.5">
          Build a resume you’re proud to send with an{" "}
          <span className="text-nowrap bg-linear-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">
            AI-powered{" "}
          </span>{" "}
          resume builder.
        </h1>

        <p className="my-7 max-w-xl text-center text-base text-slate-700">
          Paste your resume, get clear suggestions to improve wording and impact statements, optionally tailor it to a
          specific job description, then export a clean, job-ready template.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.SIGNUP}
            className="m-1 flex h-12 items-center rounded-full bg-primary-500 px-9 text-white ring-1 ring-primary-400 ring-offset-2 transition-colors hover:bg-primary-600"
          >
            Get started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-right ml-1 size-4"
              aria-hidden="true"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
          <Link
            href={samplePreviewHref}
            className="flex h-12 items-center gap-2 rounded-full border border-slate-400 px-7 text-slate-700 transition hover:bg-primary-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-eye size-5"
              aria-hidden="true"
            >
              <path d="M2.062 12.348a1 1 0 0 1 0-.696C3.424 8.29 7.36 5 12 5s8.576 3.29 9.938 6.652a1 1 0 0 1 0 .696C20.576 15.71 16.64 19 12 19s-8.576-3.29-9.938-6.652" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>View sample</span>
          </Link>
        </div>

        <div className="mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-3 py-6 text-slate-600">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
            Built for job seekers and career changers
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
            Suggestions are optional — you stay in control
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
            Export when you’re ready
          </span>
        </div>
      </div>
    </div>
  );
}
