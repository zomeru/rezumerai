import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-b from-primary-100/40 to-white text-gray-800">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-16">
        <div className="mb-6 flex items-center space-x-3">
          <h2 className="font-semibold text-2xl text-primary-500">
            Rezumer AI
          </h2>
        </div>
        <p className="max-w-xl text-center font-normal text-sm leading-relaxed">
          Empowering creators worldwide with the most advanced AI content
          creation tools. Transform your ideas into reality.
        </p>
      </div>
      <div className="border-slate-200 border-t">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center font-normal text-sm">
          <Link href="#">Rezumer AI</Link> ©2025. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
