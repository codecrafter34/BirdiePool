'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadProof(winnerId: string, formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('proof') as File;
  
  if (!file) return { error: 'No file provided' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // First, check if the winner record belongs to the user
  const { data: winner, error: winnerError } = await supabase
    .from('winners')
    .select('id')
    .eq('id', winnerId)
    .eq('user_id', user.id)
    .single();

  if (winnerError || !winner) return { error: 'Invalid winner record' };

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

  // Insert or Update the proof_uploads table
  // Check if an existing proof_upload exists for this winner
  const { data: existingProof } = await supabase
    .from('proof_uploads')
    .select('id')
    .eq('winner_id', winnerId)
    .single();

  if (existingProof) {
    // If re-uploading after rejection
    const { error: updateError } = await supabase
      .from('proof_uploads')
      .update({ 
        file_url: publicUrlData.publicUrl,
        status: 'pending_review',
        admin_remarks: null // Clear previous remarks
      })
      .eq('id', existingProof.id);
      
    if (updateError) return { error: updateError.message };
  } else {
    // Fresh upload
    const { error: insertError } = await supabase
      .from('proof_uploads')
      .insert({
        winner_id: winnerId,
        file_url: publicUrlData.publicUrl,
        status: 'pending_review'
      });
      
    if (insertError) return { error: insertError.message };
  }

  // Set the actual winner status to 'pending'
  await supabase.from('winners').update({ status: 'pending' }).eq('id', winnerId);

  revalidatePath('/dashboard/winnings');
  return { success: true };
}

export async function reviewProof(proofId: string, winnerId: string, status: 'verified' | 'rejected', remarks?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  // Update proof_uploads table
  const { error: proofError } = await supabase
    .from('proof_uploads')
    .update({ 
      status: status,
      admin_remarks: remarks || null
    })
    .eq('id', proofId);

  if (proofError) return { error: proofError.message };

  // Update winners table status
  const winnerStatus = status === 'verified' ? 'approved' : 'rejected';
  const { error: winnerError } = await supabase
    .from('winners')
    .update({ status: winnerStatus })
    .eq('id', winnerId);

  if (winnerError) return { error: winnerError.message };
  
  revalidatePath('/admin/winners');
  return { success: true };
}

export async function markPayoutComplete(winnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  // Only allow payout if status is approved
  const { error } = await supabase
    .from('winners')
    .update({ status: 'paid' })
    .eq('id', winnerId)
    .eq('status', 'approved');

  if (error) return { error: error.message };

  revalidatePath('/admin/winners');
  return { success: true };
}
