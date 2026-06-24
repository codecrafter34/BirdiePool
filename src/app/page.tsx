import HeroCanvas from "@/components/3d/HeroCanvasWrapper";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { Target, HeartHandshake, Trophy, Award, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch initial data for the landing page
  const { data: charities } = await supabase.from('charities').select('*').limit(3);
  
  const { data: latestPrizePool } = await supabase
    .from('prize_pools')
    .select('total_amount')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: lastDraw } = await supabase
    .from('draws')
    .select('executed_at')
    .eq('status', 'completed')
    .order('executed_at', { ascending: false })
    .limit(1)
    .single();

  const currentPrizePool = latestPrizePool?.total_amount || 8500;
  
  const lastDrawDateStr = lastDraw?.executed_at 
    ? new Date(lastDraw.executed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'May 31, 2026';

  const today = new Date();
  const nextDrawDateStr = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col min-h-[100dvh] w-full px-4 overflow-hidden pt-20">
        {/* 3D Canvas Layer - Scoped specifically to Hero */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 md:opacity-40">
           <HeroCanvas />
        </div>
        {/* Top spacer to balance the bottom discover section */}
        <div className="flex-1 hidden md:block"></div>

        <div className="relative z-10 w-full max-w-5xl mx-auto flex-none flex flex-col items-center justify-center pt-32 pb-12 md:pt-0 md:pb-0 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/30 backdrop-blur-md mb-8 shadow-lg shadow-black/50">
            <span className="text-xs md:text-sm font-bold tracking-widest text-primary uppercase">Golf</span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
            <span className="text-xs md:text-sm font-bold tracking-widest text-primary uppercase">Charity</span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
            <span className="text-xs md:text-sm font-bold tracking-widest text-primary uppercase">Rewards</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 drop-shadow-2xl leading-[1.1] mx-auto w-full">
            Turn Every Round Into <span className="text-primary block md:inline">Real Impact.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl drop-shadow-lg font-medium px-4">
            Submit your golf scores, support meaningful charities, and unlock monthly reward opportunities through BirdiePool.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Link 
              href="/signup"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 text-center flex-1 sm:flex-none"
            >
              Start Your Journey
            </Link>
            <Link 
              href="#charities"
              className="bg-secondary/80 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-secondary transition-all border border-border/50 hover:border-border text-center flex-1 sm:flex-none"
            >
              Explore Charities
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative z-10 flex-1 flex flex-col justify-end items-center pb-8 hidden md:flex mt-8 md:mt-0">
          <ScrollIndicator />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 border-y border-border/50 bg-card/50 backdrop-blur-xl mt-12 md:mt-24">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-8 md:gap-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">$24.5K</span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Charity Donated</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">1,204</span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Players</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-black text-accent mb-2 tracking-tight">${currentPrizePool.toLocaleString()}</span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Prize Pool</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">45,021</span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Scores Logged</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 md:py-32 px-6 bg-background/95 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">How BirdiePool Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A seamless experience designed for golfers who want their performance to mean more.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="bg-card/40 border border-border/50 p-8 rounded-3xl relative overflow-hidden group hover:bg-card/80 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2 uppercase tracking-wider text-sm">Step 1</h3>
              <h4 className="text-xl font-semibold text-white mb-4">Enter Your Last 5 Golf Scores</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log your Stableford scores after your rounds. Our system uses your performance analytics to generate your unique monthly entry.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card/40 border border-border/50 p-8 rounded-3xl relative overflow-hidden group hover:bg-card/80 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <HeartHandshake className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2 uppercase tracking-wider text-sm">Step 2</h3>
              <h4 className="text-xl font-semibold text-white mb-4">Choose a Charity to Support</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A portion of your subscription goes directly to your selected cause. Impact your community while playing the game you love.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card/40 border border-border/50 p-8 rounded-3xl relative overflow-hidden group hover:bg-card/80 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/20">
                <Trophy className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-accent mb-2 uppercase tracking-wider text-sm">Step 3</h3>
              <h4 className="text-xl font-semibold text-white mb-4">Join Monthly Prize Draws</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your accumulated scores act as your entry. If your numbers match the algorithmic draw, you win a share of the rolling prize pool.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-card/40 border border-border/50 p-8 rounded-3xl relative overflow-hidden group hover:bg-card/80 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2 uppercase tracking-wider text-sm">Step 4</h3>
              <h4 className="text-xl font-semibold text-white mb-4">Verify Wins & Claim Rewards</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload proof of your scorecard for verification. Once approved by our team, your prize is instantly transferred to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charities Section */}
      <section id="charities" className="relative z-10 py-24 md:py-32 px-6 bg-card border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Our Impact Partners</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Every subscription contributes to making a real difference. Here are some of the amazing organizations our players support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {charities?.map((charity) => (
              <div key={charity.id} className="bg-background border border-border/50 p-8 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                <h4 className="text-2xl font-bold text-white mb-4">{charity.name}</h4>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{charity.description}</p>
                <div className="pt-6 border-t border-border/50 flex justify-between items-end">
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Impact Raised</span>
                    <span className="text-2xl font-black text-primary">${charity.donation_stats || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!charities || charities.length === 0) && (
              <div className="col-span-3 text-center p-12 text-muted-foreground">
                More charities joining soon. Check back later!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Prize Pool Section */}
      <section id="prizes" className="relative z-10 py-24 md:py-32 px-6 bg-background/95 border-t border-border scroll-mt-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Monthly Prize Pool</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Submit your scores to earn entries. The better you play relative to your handicap, the better your chances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Prize Breakdown */}
            <div className="bg-card border border-border/50 p-8 md:p-12 rounded-3xl text-left">
              <h3 className="text-2xl font-bold text-white mb-8">Prize Distribution</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🥇</span>
                    <div>
                      <h4 className="text-lg font-bold text-white">5 Match Winner</h4>
                      <p className="text-sm text-muted-foreground">Grand Prize Split</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-primary">40%</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🥈</span>
                    <div>
                      <h4 className="text-lg font-bold text-white">4 Match Winner</h4>
                      <p className="text-sm text-muted-foreground">Secondary Pool</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-secondary">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🥉</span>
                    <div>
                      <h4 className="text-lg font-bold text-white">3 Match Winner</h4>
                      <p className="text-sm text-muted-foreground">Bronze Pool</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-accent">25%</span>
                </div>
              </div>
            </div>

            {/* Current Stats */}
            <div className="space-y-6">
              <div className="bg-card/40 border border-border/50 p-8 rounded-3xl">
                <span className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Current Prize Pool</span>
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">${currentPrizePool.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card/40 border border-border/50 p-6 rounded-3xl">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Last Draw Date</span>
                  <span className="text-lg font-bold text-white">{lastDrawDateStr}</span>
                </div>
                <div className="bg-card/40 border border-border/50 p-6 rounded-3xl">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Next Draw Date</span>
                  <span className="text-lg font-bold text-white">{nextDrawDateStr}</span>
                </div>
              </div>
              <div className="pt-4">
                <Link 
                  href="/dashboard/winnings"
                  className="inline-flex items-center justify-center w-full bg-secondary/80 text-white px-8 py-4 rounded-xl font-bold hover:bg-secondary transition-all border border-border/50 hover:border-border"
                >
                  View Previous Winners
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative z-10 py-24 md:py-32 px-6 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">Ready to make your rounds count?</h2>
          <Link 
            href="/signup"
            className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-full font-bold text-lg md:text-xl hover:bg-primary/90 transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </main>
  );
}
