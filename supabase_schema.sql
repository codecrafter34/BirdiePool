-- BirdiePool Database Schema & RLS Policies
-- Execute this in the Supabase SQL Editor

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'visitor' CHECK (role IN ('visitor', 'subscriber', 'admin')),
    razorpay_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.charities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    donation_stats NUMERIC DEFAULT 0,
    razorpay_account_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.charity_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    description TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    charity_id UUID REFERENCES public.charities(id),
    razorpay_subscription_id TEXT UNIQUE,
    plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')),
    status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete')),
    contribution_percentage NUMERIC CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    renewal_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    razorpay_payment_intent_id TEXT UNIQUE,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('succeeded', 'pending', 'failed')),
    charity_allocation NUMERIC NOT NULL,
    prize_pool_allocation NUMERIC NOT NULL,
    platform_fee_allocation NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 1 AND score <= 45),
    play_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, play_date)
);

CREATE TABLE public.draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
    winning_numbers JSONB,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(month, year)
);

CREATE TABLE public.draw_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
    entry_type TEXT DEFAULT 'score_derived',
    entry_numbers JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.draw_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id),
    draw_id UUID REFERENCES public.draws(id),
    generated_numbers JSONB NOT NULL,
    match_5_count INTEGER DEFAULT 0,
    match_4_count INTEGER DEFAULT 0,
    match_3_count INTEGER DEFAULT 0,
    simulated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.prize_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
    total_amount NUMERIC DEFAULT 0,
    match_5_amount NUMERIC DEFAULT 0,
    match_4_amount NUMERIC DEFAULT 0,
    match_3_amount NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    draw_entry_id UUID REFERENCES public.draw_entries(id),
    match_type INTEGER CHECK (match_type IN (3, 4, 5)),
    prize_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.proof_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    winner_id UUID REFERENCES public.winners(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'verified', 'rejected')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    scores_hash TEXT NOT NULL,
    insights_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper Function for Admin Check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users Policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (public.is_admin());

-- Charities Policies
CREATE POLICY "Charities are public" ON public.charities FOR SELECT USING (true);
CREATE POLICY "Admins can manage charities" ON public.charities FOR ALL USING (public.is_admin());

-- Charity Events Policies
CREATE POLICY "Charity events are public" ON public.charity_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage charity events" ON public.charity_events FOR ALL USING (public.is_admin());

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());

-- Subscription Payments Policies
CREATE POLICY "Users can view own payments" ON public.subscription_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage payments" ON public.subscription_payments FOR ALL USING (public.is_admin());

-- Scores Policies
CREATE POLICY "Users can view own scores" ON public.scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all scores" ON public.scores FOR SELECT USING (public.is_admin());

-- Draws Policies
CREATE POLICY "Draws are public" ON public.draws FOR SELECT USING (true);
CREATE POLICY "Admins can manage draws" ON public.draws FOR ALL USING (public.is_admin());

-- Draw Entries Policies
CREATE POLICY "Users can view own entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all entries" ON public.draw_entries FOR SELECT USING (public.is_admin());

-- Draw Simulations Policies
CREATE POLICY "Admins only simulations" ON public.draw_simulations FOR ALL USING (public.is_admin());

-- Prize Pools Policies
CREATE POLICY "Prize pools are public" ON public.prize_pools FOR SELECT USING (true);
CREATE POLICY "Admins can manage prize pools" ON public.prize_pools FOR ALL USING (public.is_admin());

-- Winners Policies
CREATE POLICY "Users can view own wins" ON public.winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view verified wins" ON public.winners FOR SELECT USING (status = 'paid');
CREATE POLICY "Admins can manage winners" ON public.winners FOR ALL USING (public.is_admin());

-- Proof Uploads Policies
CREATE POLICY "Users can view own proofs" ON public.proof_uploads FOR SELECT USING (EXISTS (SELECT 1 FROM public.winners WHERE id = winner_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own proofs" ON public.proof_uploads FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.winners WHERE id = winner_id AND user_id = auth.uid()));
CREATE POLICY "Admins can manage proofs" ON public.proof_uploads FOR ALL USING (public.is_admin());

-- AI Insights Policies
CREATE POLICY "Users can view own insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Admins only audit logs" ON public.audit_logs FOR ALL USING (public.is_admin());

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 4. Triggers
-- Automatically create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'visitor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to evict oldest score keeping only 5 per user
CREATE OR REPLACE FUNCTION public.evict_oldest_score()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.scores
  WHERE id IN (
    SELECT id FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY play_date DESC, created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_max_5_scores
  AFTER INSERT ON public.scores
  FOR EACH ROW EXECUTE PROCEDURE public.evict_oldest_score();
