import { getAdminStats, approveWinner } from "@/actions/admin";
import { runDrawSimulation } from "@/actions/draws";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { createClient } from "@/lib/supabase/server";
export default async function AdminDashboardPage() {
  const { stats, error } = await getAdminStats();

  if (error || !stats) {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  let { data: pendingWinners, error: pwError } = await supabase
    .from('winners')
    .select('*, users(full_name, email)')
    .eq('status', 'pending');

  if (pwError || !pendingWinners) {
    const { data: fallbackWinners } = await supabase
      .from('winners')
      .select('*, users(full_name, email)')
      .eq('verification_status', 'pending');
    pendingWinners = fallbackWinners || [];
  }
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Command Center</h1>
          <p className="text-muted-foreground mt-1">Manage platform, run draw simulations, and verify winners.</p>
        </div>
        <div className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-bold border border-destructive/20 hidden md:block">
          Superadmin Access
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
          <p className="text-3xl font-bold text-white">{stats.users}</p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-white">{stats.subscriptions}</p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Pending Proofs</p>
          <p className="text-3xl font-bold text-accent">{stats.pendingProofs}</p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Charity Pool</p>
          <p className="text-3xl font-bold text-primary">${stats.charityPool.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Draw Simulation Control */}
        <div className="p-8 rounded-2xl border border-border bg-card">
          <h3 className="text-xl font-bold text-white mb-4">Draw Engine Control</h3>
          <p className="text-sm text-muted-foreground mb-6">Simulate the monthly draw algorithm to verify distributions before actual execution. Generates audit logs.</p>
          
          <div className="bg-background border border-border rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Target Month:</span>
              <span className="text-white font-medium">{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Eligible Entries:</span>
              <span className="text-white font-medium">Auto-calculated</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <form action={async () => {
              "use server";
              const d = new Date();
              await runDrawSimulation(d.getDate(), d.getMonth() + 1, d.getFullYear());
            }} className="flex-1">
              <SubmitButton className="bg-accent text-accent-foreground px-4 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors w-full shadow-lg shadow-accent/20">
                Run Simulation Preview
              </SubmitButton>
            </form>

            <form action={async () => {
              "use server";
              const { publishDrawResults } = await import("@/actions/draws");
              await publishDrawResults();
            }} className="flex-1">
              <SubmitButton className="bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors w-full shadow-lg shadow-primary/20">
                Publish Official Results
              </SubmitButton>
            </form>
          </div>
        </div>

        {/* Winner Verification Queue */}
        <div className="p-8 rounded-2xl border border-border bg-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Winner Verification</h3>
            <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">{stats.pendingProofs} Pending</span>
          </div>
          
          <div className="flex-1 border border-border rounded-xl flex flex-col p-6 bg-background/50 overflow-hidden">
            <p className="text-sm text-muted-foreground mb-4">Pending approvals for winners</p>
            <div className="space-y-4 overflow-y-auto">
              {pendingWinners && pendingWinners.length > 0 ? (
                pendingWinners.map((winner) => (
                  <div key={winner.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                    <div>
                      <p className="font-bold text-white">Tier {winner.match_type} Winner</p>
                      <p className="text-sm text-muted-foreground">User: {winner.users?.email} • Prize: ${Number(winner.prize_amount).toLocaleString()}</p>
                    </div>
                    <form action={async () => {
                      "use server";
                      await approveWinner(winner.id);
                    }}>
                      <SubmitButton className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm hover:bg-primary/90">
                        Approve
                      </SubmitButton>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pending winners.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
