import { createClient } from "@/lib/supabase/server";
import { reviewProof, markPayoutComplete } from "@/actions/winners";

export default async function AdminWinnersPage() {
  const supabase = await createClient();
  const { data: winners } = await supabase
    .from('winners')
    .select('*, users(full_name, email), proof_uploads(*)')
    .order('created_at', { ascending: false });

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
                <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
                <th className="px-6 py-4 text-muted-foreground font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {winners?.map(winner => {
                const latestProof = winner.proof_uploads && winner.proof_uploads.length > 0 
                  ? winner.proof_uploads.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0]
                  : null;

                return (
                  <tr key={winner.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{winner.users?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">Match {winner.match_type}</p>
                    </td>
                    <td className="px-6 py-4 text-primary font-bold">${winner.prize_amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        winner.status === 'paid' ? 'bg-primary/20 text-primary border border-primary/30' :
                        winner.status === 'approved' ? 'bg-primary/10 text-primary' :
                        winner.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        'bg-accent/10 text-accent'
                      }`}>
                        {winner.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-col gap-2 justify-end items-end">
                      {winner.status === 'pending' && latestProof && latestProof.status === 'pending_review' && (
                        <div className="flex flex-col items-end gap-2 bg-background p-3 rounded border border-border">
                          <a href={latestProof.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium bg-muted text-white px-3 py-1.5 rounded flex items-center mb-2 w-full justify-center">View Uploaded Proof</a>
                          <div className="flex gap-2 w-full">
                            <form action={async () => { 'use server'; await reviewProof(latestProof.id, winner.id, 'verified'); }} className="flex-1">
                              <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded w-full">Approve</button>
                            </form>
                            <form action={async (formData) => { 
                              'use server'; 
                              const remarks = formData.get('remarks') as string;
                              await reviewProof(latestProof.id, winner.id, 'rejected', remarks); 
                            }} className="flex-1 flex gap-2">
                              <input type="text" name="remarks" placeholder="Rejection reason..." className="text-xs bg-muted text-white px-2 rounded border border-border/50" required />
                              <button className="text-xs font-medium bg-destructive text-destructive-foreground px-3 py-1.5 rounded">Reject</button>
                            </form>
                          </div>
                        </div>
                      )}
                      
                      {winner.status === 'approved' && (
                        <form action={async () => { 'use server'; await markPayoutComplete(winner.id); }}>
                          <button className="text-xs font-medium bg-accent text-accent-foreground px-3 py-1.5 rounded hover:bg-accent/90 transition-colors">Mark Paid</button>
                        </form>
                      )}

                      {(!latestProof || winner.status === 'pending') && !latestProof && (
                        <span className="text-xs text-muted-foreground">Awaiting Upload</span>
                      )}

                      {winner.status === 'paid' && (
                        <span className="text-xs text-primary font-bold flex items-center">Paid ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!winners || winners.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
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
