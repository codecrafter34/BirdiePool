'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardError({
  error,
  reset,
  title = "Something went wrong"
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
      <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mb-4 text-destructive">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error.message || "We encountered an unexpected error while loading this data. Please try again."}
      </p>
      <Button onClick={() => reset()} variant="outline" className="border-destructive/50 hover:bg-destructive/20 text-destructive">
        Try again
      </Button>
    </div>
  );
}
