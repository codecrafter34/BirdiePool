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

export async function adminCancelSubscription(subId: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('subscriptions').update({ status: 'canceled' }).eq('id', subId);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/subscriptions');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function adminUpdateSubscriptionStatus(subId: string, status: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('subscriptions').update({ status }).eq('id', subId);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/subscriptions');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
