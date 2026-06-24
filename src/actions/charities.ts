'use server';

import { createClient } from '@/lib/supabase/server';

export async function getCharities() {
  const supabase = await createClient();
  
  console.log('Fetching charities from database...');
  const { data: charities, error } = await supabase
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false });

  if (error) {
    console.error('Error fetching charities:', error.message);
    return { error: error.message };
  }

  console.log(`Successfully fetched ${charities.length} charities.`);

  return { charities };
}
