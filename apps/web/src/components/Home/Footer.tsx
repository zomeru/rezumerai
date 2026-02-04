import Link from "next/link";
import Logo from "../Logo";

export default function Footer() {
  return (
    <footer className="w-full bg-linear-to-b from-primary-100/40 to-white text-gray-800">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center px-6 py-16">
        <div className="mb-6 flex items-center space-x-3">
          <Logo />
        </div>
        <p className="max-w-xl text-center font-normal text-sm leading-relaxed">
          Empowering job seekers worldwide with cutting-edge AI resume tools. Turn your experience into a standout
          resume.
        </p>
      </div>
      <div className="border-slate-200 border-t">
        <div className="mx-auto max-w-[1600px] px-6 py-6 text-center font-normal text-sm">
          <Link href="#">Rezumer</Link> ©2025. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
