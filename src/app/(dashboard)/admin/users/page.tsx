import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.from('users').select('id, full_name, email, role, created_at');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">User Management</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 text-muted-foreground font-medium">Name</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Email</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Role</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map(user => (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{user.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'admin' 
                        ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                        : user.role === 'subscriber'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
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
