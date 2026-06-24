"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const fullName = formData.get("fullName") as string;
    if (!fullName || fullName.trim().length === 0) {
      return { error: "Name cannot be empty" };
    }

    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return { error: error.message || "Failed to update profile" };
  }
}

export async function updatePassword(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const newPassword = formData.get("newPassword") as string;
    
    if (!newPassword || newPassword.length < 6) {
      return { error: "Password must be at least 6 characters long" };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Update Password Error:", error);
    return { error: error.message || "Failed to update password" };
  }
}
