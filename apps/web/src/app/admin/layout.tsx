import { Navbar } from "@/components";
import { requireAdminOrNotFound } from "@/lib/admin-auth";

/**
 * Admin layout wraps all admin pages with the shared workspace navbar.
 * Access control is enforced here so every /admin page inherits the same guard.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  await requireAdminOrNotFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
}
