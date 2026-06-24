import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

import { withTimeout } from '@/lib/utils';

export const getUserProfile = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: profile, error } = await withTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
    );

    if (error) {
      return { error: error.message };
    }

    return { profile };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch profile' };
  }
});
