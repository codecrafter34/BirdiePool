import { createClient } from "@/lib/supabase/server";
import { uploadProof } from "@/actions/winners";

export default async function WinningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: winners } = await supabase
    .from('winners')
    .select('*, draws(draw_date)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">My Winnings</h2>
      <div className="grid grid-cols-1 gap-6">
        {winners?.map(winner => (
          <div key={winner.id} className="p-6 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">${winner.prize_amount}</p>
              <p className="text-sm text-muted-foreground">Match {winner.match_count} • Draw: {new Date(winner.draws?.draw_date).toLocaleDateString()}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs bg-muted px-2 py-1 rounded">Verification: {winner.verification_status || 'Pending Proof'}</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">Payout: {winner.payout_status || 'Pending'}</span>
              </div>
            </div>
            
            {(!winner.proof_url || winner.verification_status === 'rejected') && (
              <form action={async (formData) => {
                'use server';
                await uploadProof(winner.id, formData);
              }} className="flex items-center gap-2">
                <input type="file" name="proof" accept="image/*,.pdf" className="text-sm text-white" required />
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm">
                  Upload ID
                </button>
              </form>
            )}
            
            {winner.proof_url && winner.verification_status !== 'rejected' && (
              <div className="text-sm text-muted-foreground border border-border px-4 py-2 rounded">
                Proof uploaded. Awaiting admin review.
              </div>
            )}
          </div>
        ))}
        {(!winners || winners.length === 0) && (
          <p className="text-muted-foreground">You haven't won any draws yet. Keep playing!</p>
        )}
      </div>
    </div>
  );
}
