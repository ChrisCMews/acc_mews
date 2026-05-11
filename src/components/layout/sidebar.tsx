"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  BarChart3,
  Download,
  Settings,
  BookOpen,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "Bills", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/accounting-items", label: "Accounting Items", icon: BarChart3 },
  { href: "/accounting-categories", label: "Chart of Accounts", icon: BookOpen },
  { href: "/export", label: "Export CSV", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Building2 className="h-6 w-6 text-slate-700" />
        <span className="font-semibold text-slate-900">Mews Accounting</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t px-6 py-4">
        <p className="text-xs text-slate-400">Demo Environment</p>
        <p className="text-xs text-slate-400">api.mews-demo.com</p>
      </div>
    </aside>
  );
}
