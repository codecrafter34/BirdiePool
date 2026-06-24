'use client';

import Link from "next/link";
import { Target, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0"></div>
      
      <div className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Target className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight text-white">Birdie<span className="text-primary">Pool</span></span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 text-center">Welcome back</h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">Sign in to your account to continue making an impact.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
            <input 
              name="email"
              type="email" 
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="golfer@example.com"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-muted-foreground">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
            </div>
            <input 
              name="password"
              type="password" 
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl px-4 py-3 mt-4 hover:bg-primary/90 transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Don't have an account? <Link href="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
