import Link from "next/link";
import { ROUTES } from "@/constants/routing";
import Logo from "../Logo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-linear-to-b from-primary-100/40 to-white text-gray-800">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center px-6 py-16">
        <div className="mb-6 flex items-center space-x-3">
          <Logo />
        </div>
        <p className="max-w-xl text-center font-normal text-sm leading-relaxed">
          Rezumer is an AI-assisted resume builder for job seekers, career changers, and professionals who want a
          stronger resume without hiring a resume writer. Currently in early access.
        </p>
      </div>
      <div className="border-slate-200 border-t">
        <div className="mx-auto max-w-[1600px] px-6 py-6 text-center font-normal text-sm">
          <Link href={ROUTES.HOME}>Rezumer</Link> ©{year}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
