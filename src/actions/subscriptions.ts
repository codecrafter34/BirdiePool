'use server';

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

import { withTimeout } from '@/lib/utils';

export const getUserSubscription = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    console.log(`Fetching subscription for user: ${user.id}`);
    const { data: subscription, error } = await withTimeout(
      supabase
        .from('subscriptions')
        .select('*, charities(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()
    );

    if (error) {
      console.error("Error fetching user subscription:", error);
      return { error: error.message };
    }

    if (subscription) {
      console.log(`Found active subscription: ${subscription.id}`);
    } else {
      console.log("No active subscription found.");
    }

    return { subscription: subscription || null };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch subscription' };
  }
});

export async function updateCharityPreferences(charityId: string, percentage: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    if (typeof percentage !== 'number' || percentage < 10 || percentage > 100) {
      return { error: "Invalid charity percentage. Must be between 10 and 100." };
    }

    if (!charityId) {
      return { error: "Invalid charity selection." };
    }

    console.log(`Updating charity preferences for user ${user.id}: ${percentage}% to charity ${charityId}`);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        charity_id: charityId,
        contribution_percentage: percentage
      })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error("Database error updating preferences:", error);
      return { error: error.message };
    }

    // Force Next.js to revalidate the dashboard cache
    const { revalidatePath } = require('next/cache');
    revalidatePath('/dashboard', 'layout');

    return { success: true };
  } catch (err: any) {
    console.error("Action error updating preferences:", err);
    return { error: err.message || "Failed to update preferences" };
  }
}
