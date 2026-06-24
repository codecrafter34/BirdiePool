import { createClient } from "@/lib/supabase/server";
import { adminCancelSubscription, adminUpdateSubscriptionStatus } from "@/actions/admin-subscriptions";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const supabase = await createClient();
  const query = searchParams.query || '';

  // Fetch subscriptions with user and charity info
  let dbQuery = supabase
    .from('subscriptions')
    .select('*, users!inner(full_name, email), charities(name)')
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike('users.email', `%${query}%`);
  }

  const { data: subscriptions } = await dbQuery;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Subscription Management</h2>
          <p className="text-sm text-muted-foreground mt-1">View, filter, and manage user subscriptions.</p>
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
                <th className="px-6 py-4 text-muted-foreground font-medium">User</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Plan</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Charity (Alloc%)</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Dates</th>
                <th className="px-6 py-4 text-muted-foreground font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions?.map(sub => (
                <tr key={sub.id} className="hover:bg-muted/10">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{sub.users?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{sub.users?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-white">{sub.plan_type}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {sub.charities?.name} <span className="text-primary ml-1">({sub.contribution_percentage}%)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      sub.status === 'active' ? 'bg-primary/20 text-primary' : 
                      sub.status === 'canceled' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                    }`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-muted-foreground">Start: {new Date(sub.start_date).toLocaleDateString()}</p>
                    {sub.renewal_date && <p className="text-xs text-primary mt-1">Renews: {new Date(sub.renewal_date).toLocaleDateString()}</p>}
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    {sub.status !== 'canceled' && (
                      <form action={async () => { 'use server'; await adminCancelSubscription(sub.id); }}>
                        <button className="text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded transition-colors">
                          Cancel
                        </button>
                      </form>
                    )}
                    {sub.status === 'canceled' && (
                      <form action={async () => { 'use server'; await adminUpdateSubscriptionStatus(sub.id, 'active'); }}>
                        <button className="text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded transition-colors">
                          Reactivate
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {(!subscriptions || subscriptions.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No subscriptions found.
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
