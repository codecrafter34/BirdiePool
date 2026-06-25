import { createClient } from "@/lib/supabase/server";
import { Users, CreditCard, HeartHandshake, Trophy, Banknote, LineChart } from "lucide-react";

export default async function AdminReportsPage() {
  const supabase = await createClient();

  // Fetch Total Users
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });

  // Fetch Total Subscribers
  const { count: totalSubscribers } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');

  // Fetch Payments Data for (Charity Contributions & Prize Pool)
  const { data: payments } = await supabase.from('subscription_payments').select('charity_allocation, prize_pool_allocation').eq('status', 'succeeded');
  const totalCharityContributions = payments?.reduce((acc, curr) => acc + Number(curr.charity_allocation || 0), 0) || 0;
  const totalPrizePoolGenerated = payments?.reduce((acc, curr) => acc + Number(curr.prize_pool_allocation || 0), 0) || 0;

  // Fetch Total Payouts (Winners marked as paid)
  const { data: winners } = await supabase.from('winners').select('prize_amount').eq('status', 'paid');
  const totalPayouts = winners?.reduce((acc, curr) => acc + Number(curr.prize_amount || 0), 0) || 0;

  // Draw Statistics
  const { count: completedDraws } = await supabase.from('draws').select('*', { count: 'exact', head: true }).eq('status', 'completed');
  const { count: totalWinnersEver } = await supabase.from('winners').select('*', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'paid']);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">System Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">Aggregated platform analytics and statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Active Subscribers</p>
            <p className="text-3xl font-bold text-white">{totalSubscribers}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Charity Contributions</p>
            <p className="text-3xl font-bold text-white">${totalCharityContributions.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Prize Pool</p>
            <p className="text-3xl font-bold text-white">${totalPrizePoolGenerated.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Payouts</p>
            <p className="text-3xl font-bold text-white">${totalPayouts.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <LineChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Draw Statistics</p>
            <p className="text-3xl font-bold text-white">{completedDraws} <span className="text-sm text-muted-foreground font-normal">Draws</span></p>
            <p className="text-sm text-muted-foreground mt-1">{totalWinnersEver} Total Winners Ever</p>
          </div>
        </div>
      </div>
    </div>
  );
}
