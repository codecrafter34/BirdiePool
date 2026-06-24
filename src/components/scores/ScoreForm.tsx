'use client';

import { useState, useTransition } from "react";
import { submitScore } from "@/actions/scores";
import { Loader2 } from "lucide-react";

export function ScoreForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    startTransition(async () => {
      const result = await submitScore(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess("Score submitted successfully!");
        form.reset();
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm text-center">
          {success}
        </div>
      )}
      
      <div>
        <label htmlFor="score" className="block text-sm font-medium text-muted-foreground mb-1">
          Stableford Score (1-45)
        </label>
        <input 
          type="number" 
          name="score" 
          id="score" 
          min="1" 
          max="45" 
          required
          disabled={isPending}
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          placeholder="e.g. 36"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-muted-foreground mb-1">
          Date of Play
        </label>
        <input 
          type="date" 
          name="date" 
          id="date" 
          required
          disabled={isPending}
          max={new Date().toISOString().split('T')[0]}
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <button 
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground font-medium rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {isPending ? 'Submitting...' : 'Submit Score'}
      </button>
    </form>
  );
}
