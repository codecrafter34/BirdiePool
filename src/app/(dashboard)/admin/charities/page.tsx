import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function AdminCharitiesPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase.from('charities').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Charities Management</h2>
          <p className="text-sm text-muted-foreground">Manage available charities for user contributions.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Add Charity
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charities?.map(charity => (
          <div key={charity.id} className="p-6 bg-card border border-border rounded-xl flex flex-col hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{charity.name}</h3>
              {charity.is_featured && (
                <span className="bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Featured
                </span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-6 flex-1">{charity.description}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Raised</p>
                <p className="text-primary font-bold text-lg">${(charity.donation_stats || 0).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-sm font-medium text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50">Edit</button>
                <button className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-md hover:bg-destructive/10">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {(!charities || charities.length === 0) && (
          <div className="col-span-full p-12 border border-dashed border-border rounded-xl text-center flex flex-col items-center justify-center bg-card/30">
            <p className="text-lg font-medium text-white mb-2">No charities configured</p>
            <p className="text-sm text-muted-foreground mb-4">You need to add charities or run the seed script.</p>
          </div>
        )}
      </div>
    </div>
  );
}
