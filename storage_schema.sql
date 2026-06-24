-- 1. Create the winner-proofs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'winner-proofs', 
  'winner-proofs', 
  false, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage Policies

-- Users can upload their own proofs (must be in a folder named with their user ID)
CREATE POLICY "Users can upload their own proofs" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'winner-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own uploaded proofs
CREATE POLICY "Users can view their own proofs" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'winner-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update/delete their own proofs
CREATE POLICY "Users can update their own proofs" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'winner-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own proofs" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'winner-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all proofs across the entire bucket
CREATE POLICY "Admins can view all proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'winner-proofs' 
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can delete any proofs
CREATE POLICY "Admins can delete any proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'winner-proofs' 
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
