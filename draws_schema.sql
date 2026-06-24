-- Draws Table
CREATE TABLE IF NOT EXISTS public.draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_date DATE NOT NULL,
    draw_numbers INTEGER[] DEFAULT '{}',
    draw_type TEXT NOT NULL DEFAULT 'monthly', -- e.g., monthly, weighted, random
    prize_pool NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Winners Table
CREATE TABLE IF NOT EXISTS public.winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_count INTEGER NOT NULL, -- 3, 4, 5
    prize_amount NUMERIC NOT NULL DEFAULT 0,
    verification_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    proof_url TEXT,
    payout_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid, processing, paid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_draws_date ON public.draws(draw_date);
CREATE INDEX IF NOT EXISTS idx_draws_status ON public.draws(status);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_verification ON public.winners(verification_status);

-- Enable RLS
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for draws
-- Users can read all completed draws
CREATE POLICY "Enable read access for all users on draws"
ON public.draws FOR SELECT
USING (true);

-- Only admins can insert/update/delete draws
CREATE POLICY "Enable all access for admins on draws"
ON public.draws FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for winners
-- Users can read their own winning records
CREATE POLICY "Enable read access for users own winners"
ON public.winners FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all winning records
CREATE POLICY "Enable read access for admins on winners"
ON public.winners FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Users can update their own proof_url
CREATE POLICY "Enable update access for users own proofs"
ON public.winners FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins have full access to winners
CREATE POLICY "Enable all access for admins on winners"
ON public.winners FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
