import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCharities } from "@/actions/charities";

export default async function CharitiesPage() {
  const { charities, error } = await getCharities();
  
  const charitiesList = charities || [];

  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Our Impact <span className="text-primary">Partners</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              We carefully vet every charity on BirdiePool to ensure your contributions make a real difference. Select a charity to support during your subscription.
            </p>
          </div>
          <Link href="/dashboard/subscription" className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
            Manage your contribution <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 mb-8">
            Failed to load charities: {error}
          </div>
        )}

        {charitiesList.length === 0 && !error ? (
          <div className="p-8 text-center border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground">No charities available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {charitiesList.map((charity) => (
              <div key={charity.id} className="rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/50 transition-colors duration-300">
                <div className="h-56 bg-secondary flex items-center justify-center relative overflow-hidden">
                  <div className={`absolute inset-0 ${charity.is_featured ? 'bg-primary/20' : 'bg-accent/20'} group-hover:scale-105 transition-transform duration-700`} />
                  {charity.image_url ? (
                    <img src={charity.image_url} alt={charity.name} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:opacity-70 transition-opacity" />
                  ) : null}
                  <span className="text-white relative z-10 font-bold text-2xl tracking-tight text-center px-4 drop-shadow-md">
                    {charity.name}
                  </span>
                </div>
                <div className="p-8 flex flex-col h-[calc(100%-14rem)]">
                  {charity.is_featured ? (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4 self-start">
                      Featured Partner
                    </div>
                  ) : (
                    <div className="mt-8" />
                  )}
                  <h3 className="text-xl font-bold text-white mb-3">{charity.name}</h3>
                  <p className="text-sm text-muted-foreground mb-8 line-clamp-3 leading-relaxed flex-1">
                    {charity.description}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Raised</p>
                      <span className="text-white font-bold text-lg">${(charity.donation_stats || 0).toLocaleString()}</span>
                    </div>
                    <button className="bg-secondary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
