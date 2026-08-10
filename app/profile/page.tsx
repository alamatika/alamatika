"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

export default function ProfilePage() {

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  credits: number;
  email_private: boolean;
};
  
  const [profile, setProfile] = useState<Profile | null>(null);
const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  setEmail(user.email ?? "");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  setProfile(data);
}

    loadUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-3xl mx-auto pt-32 px-6">

        <div className="bg-zinc-900 rounded-2xl p-10 space-y-5">

          <h2 className="text-4xl font-bold text-center">
            👤 {profile?.username}
          </h2>

          <div className="flex justify-center mb-6">

{profile?.avatar ? (

<img
  src={profile.avatar}
  className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500"
/>

) : (

<div className="w-32 h-32 rounded-full bg-zinc-500 flex items-center justify-center text-5xl">
👤
</div>

)}

</div>

<h2 className="text-4xl font-bold text-center">
  {profile?.username}
</h2>

<p className="text-gray-500 italic text-center max-w-xl mx-auto mt-3 leading-8">
  {profile?.bio || "This reader hasn't written a bio yet."}
</p>

      <div className="border-t border-zinc-700 pt-6 mt-6">

<h3 className="text-yellow-400 font-bold mb-2">
📧 Email
</h3>

<p className="text-gray-400">
{profile?.email_private ? "Hidden" : email}
</p>

</div>

<Link
  href="/wallet"
  className="block mt-6 rounded-2xl border border-yellow-500/30 bg-zinc-800 p-6 hover:border-yellow-400 hover:bg-zinc-700 transition"
>

<div className="flex justify-between items-center">

<div>

<h3 className="text-yellow-400 font-bold">
💎 Wallet
</h3>

<p className="text-yellow-400 font-bold text-lg">
💎 {profile?.credits ?? 0} Credits
</p>

<p className="text-gray-500 text-sm">
Manage Wallet →
</p>

</div>

<div className="text-yellow-400 font-bold">
→
</div>

</div>

</Link> 

<div className="mt-8 flex flex-col gap-4">

  <Link
    href="/profile/settings/password"
    className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-4 hover:border-yellow-500 transition"
  >
    🔑 Change Password
  </Link>

  <Link
    href="/profile/settings/delete"
    className="rounded-xl border border-red-600 bg-zinc-800 px-6 py-4 text-red-400 hover:bg-red-900/20 transition"
  >
    🗑 Delete Account
  </Link>

</div>

<div className="mt-8 border-t border-zinc-700 pt-6">

  <h3 className="text-yellow-400 font-bold mb-4">
    ⚙️ Account Settings
  </h3>

  <div className="flex flex-col gap-3">

    <Link
      href="/profile/edit"
      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-4 transition"
    >
      ✏️ Edit Profile
    </Link>

    <Link
      href="/profile/settings"
      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-4 transition"
    >
      🔒 Security Settings
    </Link>

    <button
      onClick={handleLogout}
      className="rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 px-5 py-4 font-bold transition"
    >
      🚪 Logout
    </button>

  </div>

</div>

        </div>

      </section>

    </main>
  );
}