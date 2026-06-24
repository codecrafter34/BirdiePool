import { createClient } from "@/lib/supabase/server";

export default async function DrawHistoryPage() {
  const supabase = await createClient();

  const { data: draws } = await supabase
    .from('draws')
    .select('*, prize_pools(total_amount), winners(count)')
    .eq('status', 'completed')
    .order('executed_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Draw History</h2>
      <p className="text-sm text-muted-foreground mt-1">View the results of past monthly algorithmic draws.</p>

      <div className="grid grid-cols-1 gap-6">
        {draws?.map((draw) => {
          const poolAmount = draw.prize_pools && draw.prize_pools.length > 0 ? draw.prize_pools[0].total_amount : 0;
          const winnersCount = draw.winners?.[0]?.count || 0;
          
          return (
            <div key={draw.id} className="p-6 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{new Date(draw.executed_at).toLocaleString('default', { month: 'long', year: 'numeric' })} Draw</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase">Completed</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Executed on {new Date(draw.executed_at).toLocaleDateString()}</p>
                
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Prize Pool</p>
                    <p className="text-lg font-bold text-primary">${Number(poolAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Winners</p>
                    <p className="text-lg font-bold text-white">{winnersCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-background border border-border rounded-lg p-4 flex flex-col items-center min-w-[200px]">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Winning Numbers</p>
                <div className="flex gap-2">
                  {draw.winning_numbers?.map((num: number, idx: number) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-mono font-bold text-sm text-white shadow-inner">
                      {num}
                    </div>
                  ))}
                  {(!draw.winning_numbers || draw.winning_numbers.length === 0) && (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {(!draws || draws.length === 0) && (
          <div className="p-12 text-center border border-dashed border-border rounded-xl">
            <p className="text-lg font-medium text-white mb-2">No completed draws yet</p>
            <p className="text-sm text-muted-foreground">The first algorithmic draw will be published at the end of the month.</p>
          </div>
        )}
      </div>
    </div>
  );
}
