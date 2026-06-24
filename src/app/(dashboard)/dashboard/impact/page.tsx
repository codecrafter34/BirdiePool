import { createClient } from "@/lib/supabase/server";
import { HeartHandshake, TrendingUp, Calendar, Trophy } from "lucide-react";
import Link from "next/link";

export default async function ImpactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch active subscription and its charity
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, charities(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  // Fetch successful payments
  const { data: payments } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'succeeded')
    .order('payment_date', { ascending: false });

  // Calculate totals
  const totalDonated = payments?.reduce((sum, p) => sum + Number(p.charity_allocation || 0), 0) || 0;
  const totalPrizePoolContribution = payments?.reduce((sum, p) => sum + Number(p.prize_pool_allocation || 0), 0) || 0;
  
  // Monthly chart data prep (last 6 months)
  const monthlyData: { month: string; charity: number; pool: number }[] = [];
  if (payments) {
    const monthsMap = new Map();
    payments.forEach(p => {
      const date = new Date(p.payment_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleString('default', { month: 'short' });
      
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { label, charity: 0, pool: 0, sortVal: date.getTime() });
      }
      const data = monthsMap.get(key);
      data.charity += Number(p.charity_allocation || 0);
      data.pool += Number(p.prize_pool_allocation || 0);
    });

    const sorted = Array.from(monthsMap.values()).sort((a, b) => a.sortVal - b.sortVal).slice(-6);
    sorted.forEach(s => monthlyData.push({ month: s.label, charity: s.charity, pool: s.pool }));
  }

  // Find max value for bar chart height calculation
  const maxValue = Math.max(...monthlyData.map(d => d.charity + d.pool), 10); // min 10 for scale

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">My Impact</h2>
        <p className="text-sm text-muted-foreground mt-1">Track how your subscription is making a difference.</p>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Charity Donated</p>
            <p className="text-3xl font-bold text-white">${totalDonated.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">Money sent directly to impact partners.</p>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Prize Pool Contribution</p>
            <p className="text-3xl font-bold text-white">${totalPrizePoolContribution.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">Money added to the monthly community draw.</p>
          </div>
        </div>
      </div>

      {/* Selected Charity Banner */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Current Impact Partner</h3>
        {subscription && subscription.charities ? (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-background rounded-lg p-6 border border-border/50">
            {subscription.charities.image_url ? (
              <img src={subscription.charities.image_url} alt="Charity" className="w-32 h-32 object-cover rounded-lg" />
            ) : (
              <div className="w-32 h-32 bg-secondary rounded-lg flex items-center justify-center">
                <HeartHandshake className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-xl font-bold text-white mb-2">{subscription.charities.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{subscription.charities.description}</p>
              <div className="flex gap-4">
                <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded border border-primary/20">
                  {subscription.contribution_percentage}% Allocation
                </span>
                <Link href="/dashboard/charities" className="text-xs font-medium bg-secondary text-white px-3 py-1.5 rounded hover:bg-secondary/80 transition-colors">
                  Change Charity
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-background rounded-lg border border-border/50">
            <p className="text-muted-foreground mb-4">You do not have an active charity allocation.</p>
            <Link href="/dashboard/charities" className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm hover:bg-primary/90">
              Select a Charity
            </Link>
          </div>
        )}
      </div>

      {/* Monthly Contribution Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-white">Monthly Contribution History</h3>
        </div>
        
        {monthlyData.length > 0 ? (
          <div className="h-64 flex items-end justify-between gap-2 md:gap-8 pt-6 border-b border-border relative">
            {/* Y-Axis markers (rough visual guide) */}
            <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex flex-col justify-between text-[10px] text-muted-foreground pb-6">
              <div className="border-t border-border/30 w-full"><span className="absolute -top-2 bg-card pr-2">${maxValue.toFixed(0)}</span></div>
              <div className="border-t border-border/30 w-full"><span className="absolute -top-2 bg-card pr-2">${(maxValue/2).toFixed(0)}</span></div>
              <div></div>
            </div>
            
            {/* Bars */}
            {monthlyData.map((data, i) => {
              const charityHeight = (data.charity / maxValue) * 100;
              const poolHeight = (data.pool / maxValue) * 100;
              
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10">
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded p-2 text-xs text-center whitespace-nowrap shadow-xl z-20">
                    <p className="text-primary font-bold">Charity: ${data.charity.toFixed(2)}</p>
                    <p className="text-accent font-bold">Pool: ${data.pool.toFixed(2)}</p>
                  </div>
                  
                  {/* Stacked Bar */}
                  <div className="w-full max-w-[40px] flex flex-col justify-end rounded-t overflow-hidden relative group-hover:brightness-125 transition-all">
                    <div className="w-full bg-accent" style={{ height: `${poolHeight}%` }} />
                    <div className="w-full bg-primary" style={{ height: `${charityHeight}%` }} />
                  </div>
                  
                  {/* X-Axis Label */}
                  <div className="mt-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {data.month}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No payment history available yet.</p>
          </div>
        )}
        
        <div className="flex gap-6 mt-6 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /> Charity Allocation</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-accent" /> Prize Pool Allocation</div>
        </div>
      </div>
    </div>
  );
}
