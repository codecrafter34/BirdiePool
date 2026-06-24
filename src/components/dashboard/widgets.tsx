import { getUserProfile } from "@/actions/users";
import { getUserSubscription } from "@/actions/subscriptions";
import { getUserScores } from "@/actions/scores.queries";
import { getPerformanceInsights } from "@/actions/ai";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function OverviewHeader() {
  const { profile, error } = await getUserProfile();
  if (error) redirect('/login');
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
      <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name || 'Golfer'}. Here is what is happening with your account today.</p>
    </div>
  );
}

export async function AiInsightsCard() {
  const { insights } = await getPerformanceInsights();
  const text = insights || "Keep playing and logging scores to unlock insights.";

  return (
    <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-sm relative overflow-hidden flex items-start gap-4">
      <div className="p-3 bg-primary/20 rounded-xl text-primary shrink-0">
        <Sparkles className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-primary mb-1">AI Performance Coach</h3>
        <p className="text-white text-sm md:text-base leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function AiInsightsSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm flex items-start gap-4 animate-pulse">
      <div className="p-3 bg-primary/10 rounded-xl shrink-0 w-12 h-12"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-primary/20 rounded w-1/4"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  );
}

export async function SubscriptionStatusCard() {
  const { subscription } = await getUserSubscription();
  const isActive = subscription?.status === 'active';

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Subscription Status</h3>
      <p className="text-3xl font-bold text-white mb-1">
        {isActive ? 'Active' : 'Inactive'}
      </p>
      <p className="text-sm text-primary font-medium">
        {isActive ? (subscription?.plan_type === 'yearly' ? 'Yearly Plan' : 'Monthly Plan') : 'No Plan'}
      </p>
    </div>
  );
}

export async function CharityImpactCard() {
  const { subscription } = await getUserSubscription();
  const isActive = subscription?.status === 'active';

  let totalDonated = 0;
  
  try {
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: payments } = await supabase
        .from('subscription_payments')
        .select('charity_allocation')
        .eq('user_id', user.id)
        .eq('status', 'succeeded');
        
      if (payments) {
        totalDonated = payments.reduce((sum, p) => sum + (p.charity_allocation || 0), 0);
      }
    }
  } catch (err) {
    console.error("Error fetching total donated:", err);
  }

  const totalImpactDisplay = isActive ? `$${totalDonated.toLocaleString()}` : "No Active Subscription";

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h3 className="text-sm font-medium text-muted-foreground mb-2">My Total Impact</h3>
      <p className="text-xl font-bold text-white mb-1">{totalImpactDisplay}</p>
      <p className="text-sm text-muted-foreground">
        {subscription?.charities ? `Supporting: ${subscription.charities.name} (${subscription.contribution_percentage}%)` : 'Not supporting any charity'}
      </p>
    </div>
  );
}

export async function NextDrawCard() {
  const { scores } = await getUserScores();
  const count = scores?.length || 0;

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Next Draw Date</h3>
      <p className="text-3xl font-bold text-accent mb-1">TBD</p>
      <p className="text-sm text-muted-foreground">{count} recent scores</p>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm animate-pulse">
      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/3"></div>
    </div>
  );
}

export async function ScoresSummary() {
  const { scores } = await getUserScores();
  const safeScores = scores || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 min-h-[300px] flex flex-col justify-center items-center text-center">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <span className="text-muted-foreground text-2xl">🏌️</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          {safeScores.length > 0 ? `${safeScores.length} Scores Submitted` : 'No Scores Yet'}
        </h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          {safeScores.length > 0 
            ? 'Keep submitting scores to increase your chances in the draw!' 
            : 'Enter your first Stableford score to generate your numbers for the upcoming draw.'}
        </p>
        <Link href="/dashboard/scores" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          {safeScores.length > 0 ? 'Manage Scores' : 'Enter Score'}
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 min-h-[300px]">
        <h3 className="text-lg font-medium text-white mb-4">Recent Scores</h3>
        <div className="space-y-4">
          {safeScores.length > 0 ? (
            safeScores.slice(0, 3).map(score => (
              <div key={score.id} className="flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {score.score}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Stableford Score: {score.score}</p>
                  <p className="text-xs text-muted-foreground">Played on {new Date(score.play_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">No recent scores found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScoresSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 min-h-[300px] animate-pulse flex flex-col justify-center items-center">
        <div className="w-16 h-16 rounded-full bg-muted mb-4"></div>
        <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-muted rounded w-3/4 mb-6"></div>
        <div className="h-10 bg-muted rounded w-32"></div>
      </div>
      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 min-h-[300px] animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
             <div key={i} className="flex gap-4 items-center border-b border-border/50 pb-4">
                <div className="w-10 h-10 rounded-full bg-muted"></div>
                <div className="space-y-2 flex-1">
                   <div className="h-4 bg-muted rounded w-1/2"></div>
                   <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
