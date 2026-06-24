"use client";

import { Bell, User, Menu, X, LayoutDashboard, Target, Trophy, CreditCard, HeartHandshake, Settings, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/scores", icon: Target, label: "My Scores" },
  { href: "/dashboard/draws", icon: Trophy, label: "Draws & Prizes" },
  { href: "/dashboard/subscription", icon: CreditCard, label: "Subscription" },
  { href: "/charities", icon: HeartHandshake, label: "Charities" },
  { href: "/admin", icon: Settings, label: "Admin" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link href="/" className="md:hidden text-xl font-bold tracking-tight text-white flex items-center gap-1">
            <span className="text-primary">B</span>P
          </Link>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-medium text-white leading-none mb-1">Golfer Profile</p>
              <p className="text-xs text-muted-foreground leading-none">Subscriber</p>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-40 md:hidden flex flex-col border-t border-border animate-in slide-in-from-top-2">
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors text-base font-medium",
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
          <div className="p-4 border-t border-border bg-card">
            <button 
              onClick={handleLogout}
              disabled={isPending}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors text-base font-medium text-destructive hover:bg-destructive/10 w-full text-left disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> : <LogOut className="w-5 h-5 shrink-0" />}
              {isPending ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
