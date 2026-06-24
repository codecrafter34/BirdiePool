import { createClient } from "@/lib/supabase/server";
import { runDrawSimulation, publishDrawResults, updateDrawLogic } from "@/actions/draws";

export default async function AdminDrawsPage() {
  const supabase = await createClient();

  const { data: draws } = await supabase
    .from('draws')
    .select('*, prize_pools(*), winners(count)')
    .order('created_at', { ascending: false });

  const { data: simulations } = await supabase
    .from('draw_simulations')
    .select('*')
    .order('simulated_at', { ascending: false })
    .limit(5);

  const { data: settings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'draw_logic')
    .maybeSingle();

  const logic = settings?.value || { match_5_pct: 40, match_4_pct: 35, match_3_pct: 25 };
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Draw Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure logic, run simulations, and publish monthly results.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Draw Logic Configuration */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Prize Pool Configuration</h3>
          <form action={async (formData) => { 'use server'; await updateDrawLogic(formData); }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Match 5 (%)</label>
                <input type="number" name="pct5" defaultValue={logic.match_5_pct} className="w-full bg-background border border-border rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Match 4 (%)</label>
                <input type="number" name="pct4" defaultValue={logic.match_4_pct} className="w-full bg-background border border-border rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Match 3 (%)</label>
                <input type="number" name="pct3" defaultValue={logic.match_3_pct} className="w-full bg-background border border-border rounded px-3 py-2 text-white" />
              </div>
            </div>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 w-full">Update Configuration</button>
          </form>
        </div>

        {/* Execution Actions */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center space-y-4">
          <h3 className="text-lg font-bold text-white">Execution Engine</h3>
          <div className="flex gap-4">
            <form action={async () => { 'use server'; await runDrawSimulation(currentMonth, currentYear); }} className="flex-1">
              <button className="bg-accent text-accent-foreground px-4 py-3 rounded text-sm font-medium hover:bg-accent/90 w-full">
                Run Simulation ({currentMonth}/{currentYear})
              </button>
            </form>
            <form action={async () => { 'use server'; await publishDrawResults(); }} className="flex-1">
              <button className="bg-primary text-primary-foreground px-4 py-3 rounded text-sm font-medium hover:bg-primary/90 w-full">
                Publish Official Results
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white">Draw History</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-muted-foreground font-medium">Month/Year</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium">Prize Pool</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium">Winners</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium">Winning #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {draws?.map((draw) => {
                  const pool = draw.prize_pools && draw.prize_pools.length > 0 ? draw.prize_pools[0].total_amount : 0;
                  const winnersCount = draw.winners?.[0]?.count || 0;
                  
                  return (
                    <tr key={draw.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3 text-white font-medium">{draw.month}/{draw.year}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          draw.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                        }`}>
                          {draw.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary font-bold">${Number(pool).toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{winnersCount} winners</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {draw.winning_numbers ? JSON.stringify(draw.winning_numbers) : 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Recent Simulations</h3>
          <div className="space-y-3">
            {simulations?.map(sim => (
              <div key={sim.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">{new Date(sim.simulated_at).toLocaleString()}</span>
                  <span className="text-xs font-mono bg-background px-2 py-1 rounded text-white">{JSON.stringify(sim.generated_numbers)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mt-3">
                  <div className="bg-background rounded p-2">
                    <p className="text-[10px] text-muted-foreground">Match 5</p>
                    <p className="text-primary font-bold">{sim.match_5_count}</p>
                  </div>
                  <div className="bg-background rounded p-2">
                    <p className="text-[10px] text-muted-foreground">Match 4</p>
                    <p className="text-primary font-bold">{sim.match_4_count}</p>
                  </div>
                  <div className="bg-background rounded p-2">
                    <p className="text-[10px] text-muted-foreground">Match 3</p>
                    <p className="text-primary font-bold">{sim.match_3_count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
