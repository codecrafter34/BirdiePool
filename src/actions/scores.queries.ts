import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

import { withTimeout } from '@/lib/utils';

export const getUserScores = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const { data: scores, error } = await withTimeout(
      supabase
        .from("scores")
        .select("*")
        .eq("user_id", user.id)
        .order("play_date", { ascending: false })
    );

    if (error) {
      return { error: error.message };
    }

    return { scores };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch scores' };
  }
});
