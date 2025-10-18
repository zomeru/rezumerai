"use client";

import { faker } from "@faker-js/faker";
import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Logo from "../Logo";

const stars = Array(5)
  .fill(0)
  .map(() => uuidv4());

const menuItems = [
  { label: "Home", href: "#", id: uuidv4() },
  { label: "Features", href: "#features", id: uuidv4() },
  { label: "Testimonials", href: "#testimonials", id: uuidv4() },
  { label: "GitHub", href: "#github", id: uuidv4() },
];

const usersWithAvatars = Array(5)
  .fill(0)
  .map(() => ({
    id: uuidv4(),
    name: faker.person.firstName(),
    avatar: faker.image.avatar(),
  }));

const logos = [
  "instagram.svg",
  "framer.svg",
  "microsoft.svg",
  "huawei.svg",
  "walmart.svg",
].map((url) => {
  const baseUrl = "https://saasly.prebuiltui.com/assets/companies-logo/";
  return { url: `${baseUrl}${url}`, id: uuidv4() };
});

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const logoContainerId = useId();

  return (
    <div>
      {/* Navbar */}
      <nav className="z-50 flex w-full items-center justify-between px-6 py-4 text-sm md:px-16 lg:px-24 xl:px-40">
        <Logo />

        <div className="hidden items-center gap-8 text-slate-800 transition duration-500 md:flex">
          {menuItems.map(({ label, href, id }) => (
            <Link
              key={id}
              href={href}
              className="transition hover:text-primary-600"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          <Link
            href="/signup"
            className="hidden rounded-full bg-primary-500 px-6 py-2 text-white transition-all hover:bg-primary-700 active:scale-95 md:block"
          >
            Get started
          </Link>
          <Link
            href="/signin"
            className="hidden rounded-full border px-6 py-2 text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 md:block"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="transition active:scale-90 md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="lucide lucide-menu"
          >
            <title>Menu</title>
            <path d="M4 5h16M4 12h16M4 19h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-black/40 text-black text-lg backdrop-blur transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {menuItems.map(({ label, href, id }) => (
          <Link
            key={id}
            href={href}
            className="text-2xl text-white"
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="flex aspect-square size-10 items-center justify-center rounded-md bg-primary-600 p-1 text-white transition hover:bg-primary-700 active:ring-3 active:ring-white"
        >
          X
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center px-4 text-black text-sm md:px-16 lg:px-24 xl:px-40">
        <div className="-z-10 absolute top-28 left-1/4 size-72 bg-primary-300 opacity-30 blur-[100px] sm:size-96 xl:top-10 xl:size-120 2xl:size-132"></div>

        {/* Avatars + Stars */}
        <div className="mt-24 flex items-center">
          <div className="-space-x-3 flex pr-3">
            {usersWithAvatars.map(({ id, name, avatar }) => {
              return (
                <div className="relative" key={id}>
                  <Image
                    src={avatar}
                    alt={name}
                    className="hover:-translate-y-0.5 z-[1] size-8 rounded-full border-2 border-white object-cover transition"
                    width={200}
                    height={200}
                  />
                </div>
              );
            })}
          </div>

          <div>
            <div className="flex">
              {stars.map((id) => (
                <svg
                  key={id}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-star fill-primary-600 text-transparent"
                  aria-hidden="true"
                >
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                </svg>
              ))}
            </div>
            <p className="text-gray-700 text-sm">Used by 10,000+ users</p>
          </div>
        </div>

        {/* Headline + CTA */}
        <h1 className="mt-4 max-w-5xl text-center font-semibold text-5xl md:text-6xl md:leading-[70px]">
          Land your dream job faster with an{" "}
          <span className="text-nowrap bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">
            AI-powered{" "}
          </span>{" "}
          resume.
        </h1>

        <p className="my-7 max-w-md text-center text-base">
          Create, edit, and download stunning professional resumes — powered by
          AI precision.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/signup"
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
          <button
            type="button"
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
              className="lucide lucide-video size-5"
              aria-hidden="true"
            >
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
              <rect x="2" y="6" width="14" height="12" rx="2"></rect>
            </svg>
            <span>Try demo</span>
          </button>
        </div>

        <p className="mt-14 py-6 text-slate-600">
          Trusting by leading brands, including
        </p>

        <div
          className="mx-auto flex w-full max-w-3xl flex-wrap justify-between gap-6 py-4 max-sm:justify-center"
          id={logoContainerId}
        >
          {logos.map(({ url, id }) => (
            <div className="relative h-6 w-auto max-w-xs" key={id}>
              <Image
                src={url}
                alt="Company logo"
                className="h-6 w-auto object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
                width={100}
                height={24}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
