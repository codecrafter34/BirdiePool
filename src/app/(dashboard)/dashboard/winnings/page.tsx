import { createClient } from "@/lib/supabase/server";
import { uploadProof } from "@/actions/winners";

export default async function WinningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: winners } = await supabase
    .from('winners')
    .select('*, draws(executed_at), proof_uploads(*)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">My Winnings</h2>
      <div className="grid grid-cols-1 gap-6">
        {winners?.map(winner => {
          const latestProof = winner.proof_uploads && winner.proof_uploads.length > 0 
            ? winner.proof_uploads.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0]
            : null;

          return (
            <div key={winner.id} className="p-6 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">${winner.prize_amount}</p>
                <p className="text-sm text-muted-foreground">Match {winner.match_type} • Draw: {new Date(winner.draws?.executed_at || winner.created_at).toLocaleDateString()}</p>
                <div className="flex gap-4 mt-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${winner.status === 'paid' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>Status: {winner.status.toUpperCase()}</span>
                </div>
                {winner.status === 'rejected' && latestProof?.admin_remarks && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive max-w-md">
                    <strong>Admin Feedback:</strong> {latestProof.admin_remarks}
                  </div>
                )}
              </div>
              
              {(!latestProof || winner.status === 'rejected') && (
                <form action={async (formData) => {
                  'use server';
                  await uploadProof(winner.id, formData);
                }} className="flex flex-col items-end gap-2 bg-background p-4 rounded-xl border border-border">
                  <p className="text-xs font-bold text-muted-foreground mb-1">
                    {winner.status === 'rejected' ? 'Re-upload Proof of Identity' : 'Upload Proof of Identity'}
                  </p>
                  <div className="flex items-center gap-2">
                    <input type="file" name="proof" accept="image/*,.pdf" className="text-sm text-white" required />
                    <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm hover:bg-primary/90 transition-colors">
                      {winner.status === 'rejected' ? 'Re-Submit' : 'Upload ID'}
                    </button>
                  </div>
                </form>
              )}
              
              {latestProof && winner.status === 'pending' && (
                <div className="text-sm text-accent font-medium border border-accent/20 bg-accent/5 px-4 py-2 rounded">
                  Proof uploaded. Awaiting admin review.
                </div>
              )}
            </div>
          );
        })}
        {(!winners || winners.length === 0) && (
          <div className="p-12 text-center border border-dashed border-border rounded-xl">
            <p className="text-lg font-medium text-white mb-2">No winnings recorded yet</p>
            <p className="text-sm text-muted-foreground">Submit your scores regularly for a chance to win in the monthly draw!</p>
          </div>
        )}
      </div>
    </div>
  );
}
