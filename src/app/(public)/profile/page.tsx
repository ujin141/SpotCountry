"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Loader2, Save, Camera, Mail, Upload } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/login');
        return;
      }

      setUser(user);
      
      // 1. Load from Auth Metadata (Default)
      setName(user.user_metadata?.full_name || "");
      setAvatarUrl(user.user_metadata?.avatar_url || "");

      // 2. Load from Profiles Table (Custom Data)
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('name, bio, avatar_url')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

      if (profile) {
        if (profile.name) setName(profile.name);
        if (profile.bio) setBio(profile.bio);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      } else {
        // Create if missing (Use upsert to handle race conditions)
        await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                role: 'user',
                status: 'active'
            }, { onConflict: 'id' });
      }

    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploading(true);
    setMessage(null);

    try {
      // 1. Upload to Supabase Storage ('avatars' bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("row-level security")) {
           throw new Error("Storage not configured. Please create a public bucket named 'avatars' in your Supabase Dashboard.");
        }
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update State & Preview
      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Image uploaded! Click Save to apply changes.' });

    } catch (error: any) {
      console.error("Error uploading image:", error);
      setMessage({ type: 'error', text: error.message || "Failed to upload image." });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage(null);

    try {
      // 1. Update Supabase Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name, avatar_url: avatarUrl }
      });

      if (authError) throw authError;

      // 2. Update Profiles Table
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name,
          bio: bio,
          avatar_url: avatarUrl,
          // Remove updated_at if it's not in schema or handle it
        })
        .eq('id', user.id); // upsert doesn't need .eq() usually but .update() does. I'll use upsert to be safe or update.
      
      // Wait, original code used .update(). .upsert() is better if row might be missing, but we handle missing in load.
      // But let's stick to update if we know it exists, or upsert if we want to be safe.
      // Let's use upsert with id to ensure it works.
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name,
          bio: bio,
          avatar_url: avatarUrl
          // email is managed by auth trigger
        });

      if (upsertError) throw upsertError;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh();

    } catch (error: any) {
      console.error("Error saving profile:", error);
      setMessage({ type: 'error', text: error.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-500 mt-2">Manage your public profile information.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header / Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="relative group">
              <div 
                className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
                
                {/* Overlay while uploading */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                )}
              </div>
              
              {/* Camera Icon Overlay */}
              <button 
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors z-10" 
                title="Change Avatar"
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="pt-14 px-8 pb-8">
          <form onSubmit={handleSave} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.type === 'error' && <Upload className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Introduction</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tell us a little about yourself..."
              />
            </div>

            {/* Avatar URL (Optional manual entry for now) - Removed since we have upload, but kept simple text if upload fails? No, let's keep it clean. */}

            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <Link href="/" className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
