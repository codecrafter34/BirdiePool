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

export async function adminUpsertCharity(formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    
    const id = formData.get('id') as string | null;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const is_featured = formData.get('is_featured') === 'on';
    const imageFile = formData.get('image') as File | null;

    let image_url = formData.get('existing_image_url') as string | null;

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('charity-images')
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from('charity-images')
        .getPublicUrl(fileName);
        
      image_url = publicUrl;
    }

    const payload = {
      name,
      description,
      is_featured,
      image_url
    };

    if (id) {
      const { error } = await supabase.from('charities').update(payload).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('charities').insert(payload);
      if (error) throw new Error(error.message);
    }

    revalidatePath('/admin/charities');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function adminToggleCharityFeatured(id: string, currentStatus: boolean) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('charities').update({ is_featured: !currentStatus }).eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/charities');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function adminDeleteCharity(id: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('charities').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/charities');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
