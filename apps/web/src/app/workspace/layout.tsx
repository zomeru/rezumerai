import { Navbar } from "@/components";

/**
 * AppLayout wraps all workspace-related pages, providing a consistent layout with a persistent Navbar.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
}
