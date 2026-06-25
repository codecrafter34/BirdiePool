'use server';

import { createClient } from "@/lib/supabase/server";
import { DrawEngine } from "@/services/draw.service";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");
  return { supabase, user };
}

export async function runDrawSimulation(day: number, month: number, year: number) {
  try {
    const { supabase, user } = await requireAdmin();
    const result = await DrawEngine.simulateDraw(supabase, user.id, day, month, year);
    revalidatePath('/admin/draws');
    revalidatePath('/admin');
    return { success: true, result };
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export async function publishDrawResults() {
  try {
    const { supabase } = await requireAdmin();
    const result = await DrawEngine.executeDailyDraw(supabase);
    revalidatePath('/admin/draws');
    revalidatePath('/admin');
    return result;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export async function updateDrawLogic(formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    
    const pct5 = Number(formData.get('pct5'));
    const pct4 = Number(formData.get('pct4'));
    const pct3 = Number(formData.get('pct3'));

    if (pct5 + pct4 + pct3 !== 100) {
      return { error: 'Percentages must add up to 100' };
    }

    const value = {
      match_5_pct: pct5,
      match_4_pct: pct4,
      match_3_pct: pct3
    };

    const { error } = await supabase.from('system_settings')
      .upsert({ key: 'draw_logic', value }, { onConflict: 'key' });

    if (error) throw new Error(error.message);

    revalidatePath('/admin/draws');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
