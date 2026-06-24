'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");
  return { supabase };
}

export async function adminEditScore(scoreId: string, newScore: number) {
  try {
    if (newScore < 0 || newScore > 54) throw new Error("Invalid Stableford score (must be 0-54)");
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('scores').update({ score: newScore }).eq('id', scoreId);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/scores');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function adminDeleteScore(scoreId: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('scores').delete().eq('id', scoreId);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/scores');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
