"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Navbar from "../../../../components/navbar";
import AdminGuard from "../../../../components/AdminGuard";

type Profile = {
  id: string;
  is_admin: boolean;
  created_at: string;
  email: string | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  avatar: string | null;
  bio: string | null;
  joined_at: string | null;
  banned: boolean;
  credits: number;
  email_private: boolean;
};

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error loading user:", error);
        setLoading(false);
        return;
      }

      setUser(data);
      setLoading(false);
    }

    loadUser();
  }, [id]);

  async function toggleBan() {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        banned: !user.banned,
      })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setUser({
      ...user,
      banned: !user.banned,
    });
  }

  if (loading) {
    return (
      <AdminGuard>
        <main className="min-h-screen bg-black text-white">
          <Navbar />

          <section className="max-w-4xl mx-auto pt-32 px-6">
            <p className="text-gray-400">
              Loading user...
            </p>
          </section>
        </main>
      </AdminGuard>
    );
  }

  if (!user) {
    return (
      <AdminGuard>
        <main className="min-h-screen bg-black text-white">
          <Navbar />

          <section className="max-w-4xl mx-auto pt-32 px-6">
            <h1 className="text-3xl font-bold text-red-400">
              User not found
            </h1>

            <button
              onClick={() => router.push("/admin/users")}
              className="mt-6 px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold"
            >
              ← Back to Users
            </button>
          </section>
        </main>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-4xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          <button
            onClick={() => router.push("/admin/users")}
            className="text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            ← Back to Users
          </button>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400">
            User Profile
          </h1>

          <p className="text-gray-400 mt-3">
            View account information and manage this user.
          </p>

          {/* PROFILE */}

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 sm:p-8 mt-10">

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-28 h-28 rounded-full object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-zinc-700 flex items-center justify-center text-5xl">
                  👤
                </div>
              )}

              <div className="text-center sm:text-left">

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">

                  <h2 className="text-3xl font-bold">
                    {user.username}
                  </h2>

                  {user.is_admin && (
                    <span className="px-2 py-1 text-xs rounded-lg bg-yellow-500 text-black font-bold">
                      ADMIN
                    </span>
                  )}

                  {user.banned && (
                    <span className="px-2 py-1 text-xs rounded-lg bg-red-600 text-white font-bold">
                      BANNED
                    </span>
                  )}

                </div>

                {user.display_name && (
                  <p className="text-gray-300 mt-1">
                    {user.display_name}
                  </p>
                )}

                {user.bio && (
                  <p className="text-gray-400 mt-4 max-w-xl">
                    {user.bio}
                  </p>
                )}

              </div>

            </div>

          </div>


          {/* ACCOUNT INFORMATION */}

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 sm:p-8 mt-6">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              👤 Account Information
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-gray-500 text-sm">
                  Username
                </p>

                <p className="font-semibold">
                  {user.username}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">
                  Email
                </p>

                <p className="font-semibold">
                  {user.email ?? "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">
                  Joined
                </p>

                <p className="font-semibold">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

            </div>

          </div>


          {/* STATS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <p className="text-gray-500 text-sm">
                Points
              </p>

              <p className="text-3xl font-bold text-yellow-400 mt-2">
                {user.points}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <p className="text-gray-500 text-sm">
                Credits
              </p>

              <p className="text-3xl font-bold text-green-400 mt-2">
                {user.credits}
              </p>
            </div>

          </div>


          {/* ACCOUNT STATUS */}

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 sm:p-8 mt-6">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              ⚙ Account Status
            </h2>

            <div className="space-y-4">

              <div className="flex justify-between items-center">
                <span className="text-gray-400">
                  Administrator
                </span>

                <span className="font-bold">
                  {user.is_admin ? "👑 Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">
                  Banned
                </span>

                <span
                  className={`font-bold ${
                    user.banned
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {user.banned ? "🔴 Yes" : "🟢 No"}
                </span>
              </div>

            </div>

          </div>


          {/* ACTIONS */}

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 sm:p-8 mt-6">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              🛠 User Actions
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">

              <button
                onClick={toggleBan}
                className={`flex-1 py-3 rounded-xl font-bold transition ${
                  user.banned
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {user.banned
                  ? "🟢 Unban User"
                  : "🔴 Ban User"}
              </button>

              <button
                onClick={() => router.push("/admin/users")}
                className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-bold transition"
              >
                ← Back to Users
              </button>

            </div>

          </div>


          <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
            © Alamatika. All Rights Reserved.
            <br />
            Version 1.0.0
          </footer>

        </section>
      </main>
    </AdminGuard>
  );
}