import Link from "next/link";
import { ROUTES } from "@/constants/routing";
import Logo from "../Logo";

interface FooterProps {
  description: string;
}

/**
 * Footer component for the homepage, containing the logo, a brief description, and copyright information.
 */
export default function Footer({ description }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-linear-to-b from-primary-100/40 to-white text-gray-800">
      <div className="mx-auto flex max-w-400 flex-col items-center px-6 py-16">
        <div className="mb-6 flex items-center space-x-3">
          <Logo />
        </div>
        <p className="max-w-xl text-center font-normal text-sm leading-relaxed">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link href={ROUTES.ABOUT}>About</Link>
          <Link href={ROUTES.FAQ}>FAQ</Link>
          <Link href={ROUTES.PRIVACY}>Privacy</Link>
          <Link href={ROUTES.TERMS}>Terms</Link>
          <Link href={ROUTES.CONTACT}>Contact</Link>
        </div>
      </div>
      <div className="border-slate-200 border-t">
        <div className="mx-auto max-w-400 px-6 py-6 text-center font-normal text-sm">
          <Link href={ROUTES.HOME}>Rezumer</Link> ©{year}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
