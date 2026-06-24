-- Database Indexes for Performance Optimization

-- Add indexes on foreign keys to optimize joins and filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_proof_uploads_winner_id ON public.proof_uploads(winner_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Add index on status fields that are frequently queried
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_proof_uploads_status ON public.proof_uploads(status);

-- Add index on dates for sorting
CREATE INDEX IF NOT EXISTS idx_scores_play_date ON public.scores(play_date DESC);
