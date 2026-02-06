import Link from "next/link";
import { ROUTES } from "@/constants/routing";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center">
        <h1 className="mb-2 bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text font-bold text-8xl text-transparent sm:text-9xl">
          404
        </h1>
        <h2 className="mb-4 font-semibold text-2xl text-slate-800 sm:text-3xl">Page not found</h2>
        <p className="mx-auto mb-8 max-w-md text-lg text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95"
        >
          Go to home
        </Link>
      </div>
    </div>
  );
}
