'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadProof(winnerId: string, formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('proof') as File;
  
  if (!file) return { error: 'No file provided' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${winnerId}-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage Bucket
  const { error: uploadError } = await supabase.storage
    .from('winner-proofs')
    .upload(fileName, file);

  if (uploadError) return { error: uploadError.message };

  const { data: publicUrlData } = supabase.storage
    .from('winner-proofs')
    .getPublicUrl(fileName);

  // Update Winners DB Record
  const { error: updateError } = await supabase
    .from('winners')
    .update({ 
      proof_url: publicUrlData.publicUrl,
      verification_status: 'pending'
    })
    .eq('id', winnerId)
    .eq('user_id', user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/dashboard/winnings');
  return { success: true };
}

export async function reviewProof(winnerId: string, status: 'verified' | 'rejected') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('winners')
    .update({ 
      verification_status: status,
      payout_status: status === 'verified' ? 'pending' : 'failed' 
    })
    .eq('id', winnerId);

  if (error) return { error: error.message };
  
  revalidatePath('/admin/winners');
  return { success: true };
}

export async function markPayoutComplete(winnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('winners')
    .update({ payout_status: 'completed' })
    .eq('id', winnerId)
    .eq('verification_status', 'verified');

  if (error) return { error: error.message };

  revalidatePath('/admin/winners');
  return { success: true };
}
