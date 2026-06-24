import { createClient } from "@/lib/supabase/server";
import { reviewProof, markPayoutComplete } from "@/actions/winners";

export default async function AdminWinnersPage() {
  const supabase = await createClient();
  const { data: winners } = await supabase.from('winners').select('*, users(full_name, email)').order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Winner Verification</h2>
        <p className="text-sm text-muted-foreground mt-1">Review uploaded identity proofs and trigger payouts.</p>
      </div>
      
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 text-muted-foreground font-medium">Winner</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Prize</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Proof Status</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Payout Status</th>
                <th className="px-6 py-4 text-muted-foreground font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {winners?.map(winner => (
                <tr key={winner.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{winner.users?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">Match {winner.match_count}</p>
                  </td>
                  <td className="px-6 py-4 text-primary font-bold">${winner.prize_amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      winner.verification_status === 'verified' ? 'bg-primary/10 text-primary' :
                      winner.verification_status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {winner.verification_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      winner.payout_status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {winner.payout_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    {winner.verification_status === 'pending' && winner.proof_url && (
                      <>
                        <a href={winner.proof_url} target="_blank" rel="noreferrer" className="text-xs font-medium bg-muted text-white px-3 py-1.5 rounded flex items-center">View</a>
                        <form action={async () => { 'use server'; await reviewProof(winner.id, 'verified'); }}>
                          <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded">Approve</button>
                        </form>
                        <form action={async () => { 'use server'; await reviewProof(winner.id, 'rejected'); }}>
                          <button className="text-xs font-medium bg-destructive text-destructive-foreground px-3 py-1.5 rounded">Reject</button>
                        </form>
                      </>
                    )}
                    {winner.verification_status === 'verified' && winner.payout_status !== 'completed' && (
                      <form action={async () => { 'use server'; await markPayoutComplete(winner.id); }}>
                        <button className="text-xs font-medium bg-accent text-accent-foreground px-3 py-1.5 rounded">Mark Paid</button>
                      </form>
                    )}
                    {(!winner.proof_url || winner.verification_status === 'rejected') && (
                      <span className="text-xs text-muted-foreground">Awaiting Upload</span>
                    )}
                    {winner.payout_status === 'completed' && (
                      <span className="text-xs text-primary font-bold flex items-center">Paid ✓</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!winners || winners.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No winners recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
