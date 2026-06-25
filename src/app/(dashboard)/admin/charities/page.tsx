import { createClient } from "@/lib/supabase/server";
import { adminUpsertCharity, adminToggleCharityFeatured, adminDeleteCharity } from "@/actions/admin-charities";
import { Star, Image as ImageIcon } from "lucide-react";

export default async function AdminCharitiesPage() {
  const supabase = await createClient();

  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Charity Partners</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage impact partners, upload images, and set featured status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create / Edit Form */}
        <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-6">
          <h3 className="text-lg font-bold text-white mb-4">Add New Charity</h3>
          <form action={async (formData) => { 'use server'; await adminUpsertCharity(formData); }} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <input type="text" name="name" required className="w-full bg-background border border-border rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea name="description" required rows={3} className="w-full bg-background border border-border rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cover Image</label>
              <input type="file" name="image" accept="image/*" className="w-full bg-background border border-border rounded px-3 py-2 text-white text-sm" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="is_featured" id="is_featured" className="w-4 h-4 rounded bg-background border-border" />
              <label htmlFor="is_featured" className="text-sm text-white">Mark as Featured</label>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded text-sm font-bold hover:bg-primary/90 transition-colors mt-2">
              Save Charity
            </button>
          </form>
        </div>

        {/* Charities List */}
        <div className="lg:col-span-2 space-y-4">
          {charities?.map(charity => (
            <div key={charity.id} className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-32 bg-background rounded-lg border border-border overflow-hidden flex items-center justify-center shrink-0">
                {charity.image_url ? (
                  <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-bold text-white">{charity.name}</h4>
                  {charity.is_featured && <Star className="w-5 h-5 text-accent fill-accent" />}
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{charity.description}</p>
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-4">
                  <span>Raised: <strong className="text-white">${Number(charity.donation_stats).toFixed(2)}</strong></span>
                </div>
                
                <div className="flex gap-2">
                  <form action={async () => { 'use server'; await adminToggleCharityFeatured(charity.id, charity.is_featured); }}>
                    <button className="text-xs font-medium bg-secondary text-white hover:bg-secondary/80 px-3 py-1.5 rounded transition-colors">
                      {charity.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                  </form>
                  <form action={async () => { 'use server'; await adminDeleteCharity(charity.id); }}>
                    <button className="text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded transition-colors">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {(!charities || charities.length === 0) && (
             <div className="p-12 text-center border border-dashed border-border rounded-xl text-muted-foreground">
               No charities added yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
