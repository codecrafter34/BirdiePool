-- Create the charity-images bucket for Admin uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'charity-images', 
  'charity-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for charity-images

-- Public can view charity images
CREATE POLICY "Public can view charity images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'charity-images');

-- Admins can insert/update/delete charity images
CREATE POLICY "Admins can manage charity images" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
    bucket_id = 'charity-images' 
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
