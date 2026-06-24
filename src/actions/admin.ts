'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getAdminStats() {
  const supabase = await createClient();
  
  // RLS will ensure only admins can fetch this if we do full scans, 
  // but it's better to explicitly check admin status first just in case
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  // Total users
  const { count: usersCount, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Active subscriptions
  const { count: subsCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Pending proofs
  const { count: proofsCount } = await supabase
    .from('proof_uploads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review');

  // Charity pool (sum of all donations)
  const { data: charities } = await supabase
    .from('charities')
    .select('donation_stats');
    
  const charityPool = charities?.reduce((acc, curr) => acc + Number(curr.donation_stats || 0), 0) || 0;

  if (usersError) return { error: usersError.message };

  return {
    stats: {
      users: usersCount || 0,
      subscriptions: subsCount || 0,
      pendingProofs: proofsCount || 0,
      charityPool: charityPool
    }
  };
}

export async function runDrawSimulation() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // For a real draw engine, we would select all entries, generate 5 random numbers, and count matches.
  // This is a simple simulation to demonstrate the process.
  
  // 1. Generate 5 random numbers (1-45)
  const generatedNumbers: number[] = [];
  while (generatedNumbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!generatedNumbers.includes(num)) {
      generatedNumbers.push(num);
    }
  }

  // 2. Insert simulation record
  const { error } = await supabase
    .from('draw_simulations')
    .insert({
      admin_id: user.id,
      generated_numbers: generatedNumbers,
      match_5_count: Math.floor(Math.random() * 2),
      match_4_count: Math.floor(Math.random() * 10),
      match_3_count: Math.floor(Math.random() * 50)
    });

  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { success: true, numbers: generatedNumbers };
}
