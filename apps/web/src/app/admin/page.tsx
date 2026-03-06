import type { LucideIcon } from "lucide-react";
import { AlertCircle, ArrowRight, BarChart3, ClipboardList, Cog, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routing";

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  isAvailable: boolean;
}

const adminSections: AdminSection[] = [
  {
    id: "errors",
    title: "Errors",
    description: "View and investigate backend errors captured by the system.",
    icon: AlertCircle,
    href: ROUTES.ADMIN_ERROR,
    isAvailable: true,
  },
  {
    id: "users",
    title: "Users",
    description: "Manage user accounts, roles, and permissions.",
    icon: Users,
    href: ROUTES.ADMIN_USERS,
    isAvailable: true,
  },
  {
    id: "system-configuration",
    title: "System Configuration",
    description: "Configure global system settings and application behavior.",
    icon: Cog,
    href: ROUTES.ADMIN_SYSTEM_CONFIG,
    isAvailable: true,
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    description: "View historical system activity and important events.",
    icon: ClipboardList,
    href: ROUTES.ADMIN_AUDIT_LOGS,
    isAvailable: true,
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Monitor system usage and platform metrics.",
    icon: BarChart3,
    href: ROUTES.ADMIN_ANALYTICS,
    isAvailable: true,
  },
];

function AdminSectionCard({ section }: { section: AdminSection }): React.JSX.Element {
  const Icon = section.icon;

  if (section.isAvailable && section.href) {
    return (
      <Link
        href={section.href}
        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
      >
        <div className="mb-4 inline-flex rounded-xl border border-primary-200 bg-primary-50 p-2 text-primary-700">
          <Icon className="size-5" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg text-slate-900">{section.title}</h2>
            <p className="mt-2 text-slate-600 text-sm">{section.description}</p>
          </div>

          <ArrowRight className="mt-1 size-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary-700" />
        </div>
      </Link>
    );
  }

  return (
    <div
      aria-disabled="true"
      className="rounded-2xl border border-slate-300 border-dashed bg-slate-50/80 p-5 opacity-80"
    >
      <div className="mb-4 inline-flex rounded-xl border border-slate-300 bg-white p-2 text-slate-500">
        <Icon className="size-5" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg text-slate-800">{section.title}</h2>
          <p className="mt-2 text-slate-600 text-sm">{section.description}</p>
        </div>

        <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 font-medium text-[11px] text-slate-600 uppercase tracking-wide">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-400 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="inline-flex items-center gap-2 font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">
            <ShieldCheck className="size-4" />
            Admin Console
          </p>
          <h1 className="mt-2 bg-linear-to-r from-slate-900 via-slate-700 to-slate-600 bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Access operational tools, monitor the system, and manage platform administration tasks.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => (
            <AdminSectionCard key={section.id} section={section} />
          ))}
        </section>
      </div>
    </main>
  );
}
