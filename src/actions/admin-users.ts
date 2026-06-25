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

export async function adminUpdateUserRole(targetUserId: string, newRole: string) {
  try {
    const { supabase } = await requireAdmin();
    if (!['visitor', 'subscriber', 'admin'].includes(newRole)) {
      throw new Error("Invalid role");
    }

    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', targetUserId);
    if (error) throw new Error(error.message);
    
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
