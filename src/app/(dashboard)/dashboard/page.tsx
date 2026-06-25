export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { 
  OverviewHeader, 
  AiInsightsCard, 
  AiInsightsSkeleton,
  SubscriptionStatusCard,
  CharityImpactCard,
  NextDrawCard,
  StatCardSkeleton,
  ScoresSummary,
  ScoresSummarySkeleton
} from "@/components/dashboard/widgets";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded" />}>
        <OverviewHeader />
      </Suspense>
      
      {/* AI Insights Card */}
      <Suspense fallback={<AiInsightsSkeleton />}>
        <AiInsightsCard />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<StatCardSkeleton />}>
          <SubscriptionStatusCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <CharityImpactCard />
        </Suspense>

        <Suspense fallback={<StatCardSkeleton />}>
          <NextDrawCard />
        </Suspense>
      </div>

      <Suspense fallback={<ScoresSummarySkeleton />}>
        <ScoresSummary />
      </Suspense>
    </div>
  );
}

