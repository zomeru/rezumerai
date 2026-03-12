import { Navbar } from "@/components";

/**
 * Text optimizer layout reuses the authenticated application shell.
 */
export default function TextOptimizerLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
}
