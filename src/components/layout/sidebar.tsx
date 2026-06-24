"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Download,
  Settings,
  BookOpen,
  Building2,
  Zap,
} from "lucide-react";
import { getActiveEnvironment, ENV_LABELS, ENV_BASE_URLS, type MewsEnvironment } from "@/lib/credentials";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounting-categories", label: "Chart of Accounts", icon: BookOpen },
  { href: "/export-api", label: "Export API", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [activeEnv, setActiveEnv] = useState<MewsEnvironment>("demo");

  useEffect(() => {
    setActiveEnv(getActiveEnvironment());
    // Re-read on storage changes (e.g. when CredentialsCard saves)
    function onStorage() { setActiveEnv(getActiveEnvironment()); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", activeEnv === "demo" ? "bg-yellow-400" : "bg-green-500")} />
          <p className="text-xs font-medium text-slate-500">{ENV_LABELS[activeEnv]} Environment</p>
        </div>
        <p className="mt-0.5 text-xs text-slate-400">{ENV_BASE_URLS[activeEnv].replace("https://", "")}</p>
      </div>
    </aside>
  );
}
