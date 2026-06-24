-- 1. Add admin update RLS policy for scores
CREATE POLICY "Admins can update all scores" ON public.scores FOR UPDATE USING (public.is_admin());

-- 2. Add admin_remarks to proof_uploads
ALTER TABLE public.proof_uploads ADD COLUMN admin_remarks TEXT;

-- 3. Create system_settings table for Draw Logic Configuration
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (public.is_admin());

-- Insert default Draw Logic config
INSERT INTO public.system_settings (key, value) VALUES (
  'draw_logic', 
  '{"match_5_pct": 40, "match_4_pct": 35, "match_3_pct": 25}'::jsonb
);
