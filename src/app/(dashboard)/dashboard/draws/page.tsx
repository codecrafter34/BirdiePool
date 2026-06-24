import { Suspense } from "react";
import { NextDrawCard } from "@/components/dashboard/widgets";

export default function DrawsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Monthly Draws</h1>
        <p className="text-muted-foreground mt-1">View upcoming draws and your past entries.</p>
      </div>

      <div className="max-w-md">
        <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-2xl" />}>
          <NextDrawCard />
        </Suspense>
      </div>
      
      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 text-center">
        <p className="text-muted-foreground">You have not participated in any previous draws yet.</p>
      </div>
    </div>
  );
}
