"use client";

import type { LandingPageInformation } from "@rezumerai/types";
import { FileText, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { DUMMY_RESUME_DATA_ID } from "@/constants/dummy";
import { ROUTES } from "@/constants/routing";
import PublicSiteNavbar from "../PublicSiteNavbar";

const SAMPLE_PREVIEW_HREF = `${ROUTES.PREVIEW}/${DUMMY_RESUME_DATA_ID}`;

interface HeroProps {
  content: LandingPageInformation;
}

/**
 * Hero section of the homepage, featuring the main headline, navigation bar, and call-to-action buttons.
 */
export default function Hero({ content }: HeroProps) {
  return (
    <div>
      <PublicSiteNavbar primaryCtaLabel={content.hero.primaryCtaLabel} />

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center px-4 text-black text-sm md:px-16 lg:px-24 xl:px-40">
        <div className="absolute top-28 left-1/4 -z-10 size-72 bg-primary-300 opacity-30 blur-[100px] sm:size-96 xl:top-10 xl:size-120 2xl:size-132"></div>

        {/* Context chips (honest, capability-based) */}
        <div className="mt-24 flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-slate-700 shadow-sm backdrop-blur">
          <span className="rounded-full bg-primary-100 px-2 py-0.5 font-semibold text-primary-700 text-xs">
            {content.bannerTag}
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
          {content.hero.title}
        </h1>

        <p className="my-7 max-w-xl text-center text-base text-slate-700">{content.hero.description}</p>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.SIGNUP}
            className="m-1 flex h-12 items-center rounded-full bg-primary-500 px-9 text-white ring-1 ring-primary-400 ring-offset-2 transition-colors hover:bg-primary-600"
          >
            {content.hero.primaryCtaLabel}
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
            href={SAMPLE_PREVIEW_HREF}
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
            <span>{content.hero.secondaryCtaLabel}</span>
          </Link>
        </div>

        <div className="mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-3 py-6 text-slate-600">
          {content.hero.trustBadges.map((badge) => (
            <span key={badge} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
