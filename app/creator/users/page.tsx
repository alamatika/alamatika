"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";

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

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
  async function fetchUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading users:", error);
      return;
    }

    setUsers(data ?? []);
  }

  fetchUsers();
}, []);

 async function toggleBan(userId: string, current: boolean) {
  const response = await fetch("/api/admin/toggle-ban", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
  userId,
  banned: !current,
}),
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.error);
    return;
  }

  const { data, error: reloadError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (reloadError) {
    console.error(reloadError);
    return;
  }

  setUsers(data ?? []);
}

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();

    return (
      user.username?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  return (
    <CreatorGuard>
    <main className="min-h-screen bg-black text-white">
      <Navbar />


      <section className="max-w-7xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

        
      <Link
  href="/creator"
  className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
>
  🏠 Creator Studio
</Link>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400">
          👥 User Management
        </h1>

        <p className="text-gray-400 mt-3">
          Manage ALAMATIKA users and their accounts.
        </p>

       <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8">

  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-gray-500">
      Total
    </p>

    <p className="text-xl sm:text-2xl font-bold text-yellow-400 mt-1">
      {users.length}
    </p>
  </div>

  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-gray-500">
      Active
    </p>

    <p className="text-xl sm:text-2xl font-bold text-green-400 mt-1">
      {users.filter((user) => !user.banned).length}
    </p>
  </div>

  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-gray-500">
      Banned
    </p>

    <p className="text-xl sm:text-2xl font-bold text-red-400 mt-1">
      {users.filter((user) => user.banned).length}
    </p>
  </div>

</div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username, display name, or email..."
          className="w-full mt-10 mb-8 rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 outline-none focus:border-yellow-500 transition"
        />

        <div className="space-y-4">

          {filteredUsers.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center text-gray-400">
              No users found.
            </div>
          )}

          {filteredUsers.map((user) => (

            <div
              key={user.id}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 sm:p-6"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                {/* USER INFO */}

                <div className="flex items-center gap-4">

                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-16 h-16 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl">
                      👤
                    </div>
                  )}

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <h2 className="text-xl font-bold">
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
                      <p className="text-gray-300">
                        {user.display_name}
                      </p>
                    )}

                    {user.email && (
                      <p className="text-gray-500 text-sm">
                        {user.email}
                      </p>
                    )}

                    <p className="text-gray-500 text-sm mt-1">
  Joined{" "}
  {new Date(user.created_at).toLocaleDateString()}
</p>

                  </div>

                </div>


                {/* STATS */}

                <div className="flex flex-wrap gap-3">

                  <div className="bg-zinc-800 rounded-xl px-4 py-3 min-w-[100px]">
                    <p className="text-xs text-gray-500">
                      Points
                    </p>

                    <p className="text-lg font-bold text-yellow-400">
                      {user.points}
                    </p>
                  </div>

                  <div className="bg-zinc-800 rounded-xl px-4 py-3 min-w-[100px]">
                    <p className="text-xs text-gray-500">
                      Credits
                    </p>

                    <p className="text-lg font-bold text-green-400">
                      {user.credits}
                    </p>
                  </div>

                </div>


                {/* ACTION */}

               <div className="flex flex-wrap gap-3">

  <button
    onClick={() =>
      window.location.href = `/creator/users/${user.id}`
    }
    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
  >
    👁 View
  </button>

  <button
    onClick={() => toggleBan(user.id, user.banned)}
    className={`px-5 py-3 rounded-xl font-bold transition ${
      user.banned
        ? "bg-green-600 hover:bg-green-500"
        : "bg-red-600 hover:bg-red-500"
    }`}
  >
    {user.banned ? "🟢 Unban" : "🔴 Ban"}
  </button>

</div>

              </div>

            </div>

          ))}

        </div>

        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
          © Alamatika. All Rights Reserved.
          <br />
          Version 1.0.0
        </footer>

      </section>
    </main>
    </CreatorGuard>
  );
}
