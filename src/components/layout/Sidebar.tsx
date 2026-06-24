"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Trophy, CreditCard, HeartHandshake, Settings, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { useTransition } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/scores", icon: Target, label: "My Scores" },
  { href: "/dashboard/draws", icon: Trophy, label: "Draws & Prizes" },
  { href: "/dashboard/subscription", icon: CreditCard, label: "Subscription" },
  { href: "/dashboard/charities", icon: HeartHandshake, label: "Charities" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-border h-16 flex items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-primary">Birdie</span>Pool
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          disabled={isPending}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> : <LogOut className="w-5 h-5 shrink-0" />}
          {isPending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
