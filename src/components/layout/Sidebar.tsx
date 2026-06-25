"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Trophy, CreditCard, HeartHandshake, Settings, LogOut, Loader2, Users, LineChart, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { useTransition } from "react";

const subscriberNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/scores", icon: Target, label: "My Scores" },
  { href: "/dashboard/draws", icon: Trophy, label: "Draw History" },
  { href: "/dashboard/winnings", icon: Trophy, label: "My Winnings" },
  { href: "/dashboard/subscription", icon: CreditCard, label: "Subscription" },
  { href: "/dashboard/impact", icon: HeartHandshake, label: "My Impact" },
  { href: "/dashboard/charities", icon: HeartHandshake, label: "Charities" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Admin Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { href: "/admin/charities", icon: HeartHandshake, label: "Charities" },
  { href: "/admin/draws", icon: Trophy, label: "Draws" },
  { href: "/admin/winners", icon: Trophy, label: "Winners" },
  { href: "/admin/scores", icon: Target, label: "Scores" },
  { href: "/admin/reports", icon: LineChart, label: "Reports" },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const isAdminView = pathname.startsWith('/admin');
  const navItems = isAdminView ? adminNavItems : subscriberNavItems;

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-border h-16 flex items-center">
        <Link href={isAdminView ? "/admin" : "/dashboard"} className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-primary">Birdie</span>Pool
          {isAdminView && <span className="text-[10px] uppercase bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-bold ml-1">Admin</span>}
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href));
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

      <div className="p-4 border-t border-border space-y-2">
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
