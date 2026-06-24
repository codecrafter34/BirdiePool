"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitScore(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const score = parseInt(formData.get("score") as string, 10);
  const playDate = formData.get("date") as string;

  if (isNaN(score) || score < 1 || score > 45) {
    return { error: "Invalid Stableford score" };
  }

  // 1. Prevent duplicate dates
  const { data: existingDateScores } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", user.id)
    .eq("play_date", playDate);

  if (existingDateScores && existingDateScores.length > 0) {
    return { error: "A score for this date already exists." };
  }

  // 2. Insert the new score
  const { error: insertError } = await supabase
    .from("scores")
    .insert({
      user_id: user.id,
      score,
      play_date: playDate,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  // 3. Enforce Max 5 scores (FIFO - delete oldest if more than 5)
  const { data: allScores, error: fetchError } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", user.id)
    .order("play_date", { ascending: false });

  if (allScores && allScores.length > 5) {
    // Delete all scores beyond the 5th (which are the oldest)
    const scoresToDelete = allScores.slice(5).map(s => s.id);
    await supabase
      .from("scores")
      .delete()
      .in('id', scoresToDelete);
  }

  revalidatePath("/dashboard/scores");
  return { success: true };
}

export async function deleteScore(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/scores");
  return { success: true };
}
