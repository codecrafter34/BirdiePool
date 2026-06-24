-- Insert sample charities into the charities table
INSERT INTO public.charities (id, name, description, image_url, is_featured, donation_stats)
VALUES 
  (
    gen_random_uuid(), 
    'Global Health Initiative', 
    'Providing essential healthcare services and medical supplies to under-resourced communities globally.', 
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80', 
    true,
    0
  ),
  (
    gen_random_uuid(), 
    'EduFuture Foundation', 
    'Building schools and providing scholarships to ensure every child has access to quality education.', 
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', 
    true,
    0
  ),
  (
    gen_random_uuid(), 
    'Ocean Conservation Society', 
    'Protecting marine life and cleaning our oceans through advocacy and direct action.', 
    'https://images.unsplash.com/photo-1618477461853-cf6ed80f04c6?w=800&q=80', 
    false,
    0
  ),
  (
    gen_random_uuid(), 
    'Food For All', 
    'Fighting hunger by distributing meals and supporting sustainable agriculture in developing regions.', 
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80', 
    true,
    0
  );
