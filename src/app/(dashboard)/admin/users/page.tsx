import { createClient } from "@/lib/supabase/server";
import { adminUpdateUserRole } from "@/actions/admin-users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const supabase = await createClient();
  const query = searchParams.query || '';

  let dbQuery = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);
  }

  const { data: users } = await dbQuery;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Search users and manage roles.</p>
        </div>
        <form className="flex gap-2">
          <input 
            type="text" 
            name="query"
            placeholder="Search name or email..." 
            defaultValue={query}
            className="bg-background border border-border rounded px-4 py-2 text-sm text-white min-w-[250px]"
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
                <th className="px-6 py-4 text-muted-foreground font-medium">Role</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Joined</th>
                <th className="px-6 py-4 text-muted-foreground font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map(u => (
                <tr key={u.id} className="hover:bg-muted/10">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{u.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      u.role === 'admin' ? 'bg-destructive/20 text-destructive' : 
                      u.role === 'subscriber' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    {u.role !== 'admin' && (
                      <form action={async () => { 'use server'; await adminUpdateUserRole(u.id, 'admin'); }}>
                        <button className="text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded transition-colors">
                          Promote to Admin
                        </button>
                      </form>
                    )}
                    {u.role === 'admin' && (
                      <form action={async () => { 'use server'; await adminUpdateUserRole(u.id, 'subscriber'); }}>
                        <button className="text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded transition-colors">
                          Demote
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
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
