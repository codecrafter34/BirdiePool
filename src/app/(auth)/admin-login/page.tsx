'use client';

import Link from "next/link";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { adminLogin } from "@/actions/auth";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await adminLogin(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-destructive/10 via-background to-background z-0"></div>
      
      <div className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-destructive/20 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-destructive" />
            <span className="text-2xl font-bold tracking-tight text-white">Admin<span className="text-destructive">Portal</span></span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 text-center">System Access</h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">Authorized personnel only.</p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded-xl text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Admin Email</label>
            <input 
              name="email"
              type="email" 
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all"
              placeholder="admin@birdiepool.com"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <input 
              name="password"
              type="password" 
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground font-bold rounded-xl px-4 py-3 mt-4 hover:bg-destructive/90 transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Not an administrator? <Link href="/login" className="text-muted-foreground underline hover:text-white transition-colors">Return to user login</Link>
        </p>
      </div>
    </main>
  );
}
