import Link from "next/link";
import { Users, Building2, Trophy, LayoutDashboard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <nav className="flex gap-4 border-b border-border/50 pb-4 overflow-x-auto">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-muted-foreground hover:bg-muted/50 px-3 py-2 rounded-lg"
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </Link>
        <Link 
          href="/admin/users" 
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-muted-foreground hover:bg-muted/50 px-3 py-2 rounded-lg"
        >
          <Users className="w-4 h-4" />
          Users
        </Link>
        <Link 
          href="/admin/charities" 
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-muted-foreground hover:bg-muted/50 px-3 py-2 rounded-lg"
        >
          <Building2 className="w-4 h-4" />
          Charities
        </Link>
        <Link 
          href="/admin/winners" 
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-muted-foreground hover:bg-muted/50 px-3 py-2 rounded-lg"
        >
          <Trophy className="w-4 h-4" />
          Winners
        </Link>
      </nav>
      {children}
    </div>
  );
}
