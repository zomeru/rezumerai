"use client";

import Logo from "./Logo";

const user = {
  name: "John Doe",
};

/**
 * Main navigation bar component for authenticated users.
 * Displays the application logo and user controls (greeting + logout button).
 *
 * Features:
 * - Responsive layout with max-width container
 * - Logo link to homepage
 * - User greeting (hidden on small screens)
 * - Logout button with hover/active states
 *
 * @returns Navigation bar with logo and user controls
 *
 * @example
 * ```tsx
 * <Navbar />
 * ```
 */
export default function Navbar(): React.JSX.Element {
  async function onLogout(): Promise<void> {}

  return (
    <div className="bg-white shadow">
      <nav className="mx-auto flex max-w-400 items-center justify-between px-4 py-4 text-slate-800 transition-all sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-4 text-sm">
          <p className="max-sm:hidden">Hi, {user.name}!</p>
          <button
            onClick={onLogout}
            type="button"
            className="rounded-full border border-gray-300 bg-white px-7 py-1.5 transition-all hover:bg-slate-50 active:scale-97"
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
