import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  const { data, error } = await supabase.from('charities').insert([
    {
      name: 'Global Health Initiative',
      description: 'Providing essential healthcare services and medical supplies to under-resourced communities globally.',
      image_url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80',
      is_featured: true,
      donation_stats: 0
    },
    {
      name: 'EduFuture Foundation',
      description: 'Building schools and providing scholarships to ensure every child has access to quality education.',
      image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
      is_featured: true,
      donation_stats: 0
    },
    {
      name: 'Ocean Conservation Society',
      description: 'Protecting marine life and cleaning our oceans through advocacy and direct action.',
      image_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80f04c6?w=800&q=80',
      is_featured: false,
      donation_stats: 0
    },
    {
      name: 'Food For All',
      description: 'Fighting hunger by distributing meals and supporting sustainable agriculture in developing regions.',
      image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80',
      is_featured: true,
      donation_stats: 0
    }
  ]);
  
  if (error) {
    console.error('Error seeding:', error);
  } else {
    console.log('Seeded charities successfully.');
  }
}

seed();
