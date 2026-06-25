import { createClient } from "@/lib/supabase/server";
import { adminEditScore, adminDeleteScore } from "@/actions/admin-scores";

export default async function AdminScoresPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const supabase = await createClient();
  const query = searchParams.query || '';

  // Fetch scores
  let dbQuery = supabase
    .from('scores')
    .select('*, users!inner(full_name, email)')
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike('users.email', `%${query}%`);
  }

  const { data: scores } = await dbQuery;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Score Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Review, enforce rules, edit or delete user-submitted Stableford scores.</p>
        </div>
        <form className="flex gap-2">
          <input 
            type="text" 
            name="query"
            placeholder="Search by email..." 
            defaultValue={query}
            className="bg-background border border-border rounded px-4 py-2 text-sm text-white"
          />
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90">Search</button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 text-muted-foreground font-medium">Player</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Score (Stableford)</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Played Date</th>
                <th className="px-6 py-4 text-muted-foreground font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scores?.map(score => (
                <tr key={score.id} className="hover:bg-muted/10 group">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{score.users?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{score.users?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xl font-bold text-primary">{score.score}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{new Date(score.play_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 flex gap-4 justify-end items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <form action={async (formData) => {
                      'use server';
                      const newScore = Number(formData.get('newScore'));
                      await adminEditScore(score.id, newScore);
                    }} className="flex items-center gap-2">
                      <input type="number" name="newScore" defaultValue={score.score} min="0" max="54" className="w-16 bg-background border border-border rounded px-2 py-1.5 text-white text-xs" required />
                      <button className="text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded transition-colors">
                        Save Edit
                      </button>
                    </form>

                    <form action={async () => { 'use server'; await adminDeleteScore(score.id); }}>
                      <button 
                        type="submit"
                        className="text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!scores || scores.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No scores found.
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
