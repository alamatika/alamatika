"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {

  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [emailPrivate, setEmailPrivate] = useState(true);

  useEffect(() => {

    async function loadProfile() {

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    router.push("/login");
    return;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (data) {
    setUsername(data.username ?? "");
    setBio(data.bio ?? "");
    setAvatar(data.avatar ?? "");
    setEmailPrivate(data.email_private ?? true);
  }

  setLoading(false);

}

    loadProfile();

  }, [router]);

  async function uploadAvatar(file: File) {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    alert("You must be logged in.");
    return;
  }

  const userId = userData.user.id;

  // Remember the old avatar
  const oldAvatar = avatar;

  const img = new Image();
  const reader = new FileReader();

  reader.readAsDataURL(file);

  reader.onload = () => {
    img.src = reader.result as string;

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const size = 256;

      canvas.width = size;
      canvas.height = size;

      ctx?.drawImage(img, 0, 0, size, size);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const filename = `${userId}-${Date.now()}.jpg`;

        // Upload new avatar first
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filename, blob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          alert(uploadError.message);
          return;
        }

        // Get new public URL
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filename);

        const newAvatarUrl = data.publicUrl;

        // Update the profile with the new avatar
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar: newAvatarUrl,
          })
          .eq("id", userId);

        if (updateError) {
          // Database update failed, remove the newly uploaded file
          await supabase.storage
            .from("avatars")
            .remove([filename]);

          alert(updateError.message);
          return;
        }

        // Show the new avatar immediately
        setAvatar(newAvatarUrl);

        // Delete the OLD avatar from Storage
        if (oldAvatar && oldAvatar.startsWith("http")) {
          try {
            const url = new URL(oldAvatar);

            const marker = "/storage/v1/object/public/avatars/";

            const index = url.pathname.indexOf(marker);

            if (index !== -1) {
              const oldPath = decodeURIComponent(
                url.pathname.substring(
                  index + marker.length
                )
              );

              if (oldPath && oldPath !== filename) {
                const { error: deleteError } =
                  await supabase.storage
                    .from("avatars")
                    .remove([oldPath]);

                if (deleteError) {
                  console.error(
                    "Old avatar cleanup error:",
                    deleteError
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              "Failed to delete old avatar:",
              error
            );
          }
        }

        alert("Avatar updated!");
      }, "image/jpeg", 0.8);
    };
  };
}
  
  async function saveProfile() {

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return;

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userData.user.id,
      username,
      bio,
      avatar,
      email_private: emailPrivate,
    });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Profile updated!");

  router.push("/profile");

}

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-3xl mx-auto pt-32 px-6">

        <h1 className="text-5xl font-bold text-yellow-400">
          Edit Profile
        </h1>

        <div className="mt-10 space-y-6">

            <div className="flex flex-col items-center mb-8">

  {avatar ? (

    <img
      src={avatar}
      alt="Avatar"
      className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500"
    />

  ) : (

    <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center text-5xl">
      👤
    </div>

  )}

  <label className="mt-6 inline-flex items-center justify-center gap-2 cursor-pointer bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl transition shadow-lg">
  📤 Choose Avatar Image

  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      if (e.target.files?.[0]) {
        uploadAvatar(e.target.files[0]);
      }

      e.target.value = "";
    }}
  />
</label>

</div>

          <input
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4"
          />

          <textarea
            value={bio}
            onChange={(e)=>setBio(e.target.value)}
            placeholder="Tell everyone about yourself..."
            rows={5}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-5"
          />

          <div className="flex items-center gap-3">

  <input
    id="emailPrivate"
    type="checkbox"
    checked={emailPrivate}
    onChange={(e) => setEmailPrivate(e.target.checked)}
    className="w-5 h-5 accent-yellow-500"
  />

  <label
    htmlFor="emailPrivate"
    className="text-gray-300 cursor-pointer"
  >
    Keep my email private
  </label>

</div>

          <button
            onClick={saveProfile}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl transition"
          >
            💾 Save Profile
          </button>

        </div>

      </section>

    </main>
  );

}