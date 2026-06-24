-- Create an RPC function to safely increment charity donation stats
CREATE OR REPLACE FUNCTION increment_charity_stats(target_charity_id UUID, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.charities
  SET donation_stats = COALESCE(donation_stats, 0) + amount
  WHERE id = target_charity_id;
END;
$$;
