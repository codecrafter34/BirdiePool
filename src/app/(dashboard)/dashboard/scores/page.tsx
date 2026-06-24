import { getUserScores } from "@/actions/scores.queries";
import { ScoreForm } from "@/components/scores/ScoreForm";
import { Trophy, Calendar } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ScoresPage() {
  const { scores, error } = await getUserScores();

  if (error) {
    redirect('/login');
  }

  const scoresList = scores || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Score Management</h1>
        <p className="text-muted-foreground mt-1">Enter your Stableford scores. The latest 5 form your draw entry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Score Entry Form */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
            <h3 className="text-lg font-medium text-white mb-6">Submit New Score</h3>
            <ScoreForm />
          </div>
        </div>

        {/* Score History */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Your Draw Entry</h3>
              <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                Latest 5 Scores
              </span>
            </div>

            <div className="space-y-4">
              {scoresList.length > 0 ? (
                scoresList.slice(0, 5).map((score) => (
                  <div key={score.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background/80 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                        {score.score}
                      </div>
                      <div>
                        <p className="text-white font-medium">Stableford Points</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {new Date(score.play_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Trophy className="w-5 h-5 text-accent" />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground">You haven't submitted any scores yet. Submit your first score to begin.</p>
                </div>
              )}
              
              {scoresList.length > 0 && scoresList.length < 5 && (
                <div className="p-8 text-center border border-dashed border-border rounded-xl mt-4">
                  <p className="text-muted-foreground">Submit {5 - scoresList.length} more score(s) to complete your entry for the next draw.</p>
                </div>
              )}
              
              {scoresList.length >= 5 && (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl mt-4 text-center">
                  <p className="text-accent text-sm font-medium">You have a complete entry for the next draw!</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
