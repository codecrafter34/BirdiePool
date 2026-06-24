"use client";

import { useState } from "react";
import { updateProfile, updatePassword } from "@/actions/settings";
import { Loader2 } from "lucide-react";

export function ProfileForm({ initialName, email }: { initialName: string, email: string }) {
  const [loading, setLoading] = useState(false);
  
  async function action(formData: FormData) {
    setLoading(true);
    const res = await updateProfile(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else alert("Profile updated successfully!");
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
      <h2 className="text-xl font-semibold text-white mb-4">Profile Settings</h2>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
          <input 
            type="text" 
            name="fullName"
            defaultValue={initialName} 
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
          <input 
            type="email" 
            defaultValue={email} 
            disabled
            className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-muted-foreground cursor-not-allowed opacity-70"
          />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
        </div>
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Profile
        </button>
      </form>
    </div>
  );
}

export function PasswordForm() {
  const [loading, setLoading] = useState(false);
  
  async function action(formData: FormData) {
    setLoading(true);
    const res = await updatePassword(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert("Password updated successfully!");
      (document.getElementById("passwordForm") as HTMLFormElement)?.reset();
    }
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
      <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
      <form id="passwordForm" action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
          <input 
            type="password"
            name="newPassword"
            placeholder="••••••••"
            required
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Password
        </button>
      </form>
    </div>
  );
}
