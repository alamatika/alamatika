"use client";

import AdminGuard from "../../components/AdminGuard";
import Navbar from "../../components/navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Admin() {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    comments: 0,
    likes: 0,
    reports: 0,
    banned: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [
        users,
        posts,
        comments,
        likes,
        reports,
        banned,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("community")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("comments")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("community_likes")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("reports")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("profiles")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("banned", true),
      ]);

      setStats({
        users: users.count ?? 0,
        posts: posts.count ?? 0,
        comments: comments.count ?? 0,
        likes: likes.count ?? 0,
        reports: reports.count ?? 0,
        banned: banned.count ?? 0,
      });

      setLoading(false);
    }

    loadStats();
  }, []);

  function logout() {
    localStorage.removeItem("alamatika-admin");
    window.location.href = "/";
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white">

        <Navbar />

        <section className="max-w-6xl mx-auto pt-28 sm:pt-32 px-4 sm:px-6">

          {/* HEADER */}

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-12">

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
                Admin Panel
              </h1>

              <p className="text-gray-400 mt-2">
                Manage the ALAMATIKA community.
              </p>
            </div>

            <button
              onClick={logout}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition"
            >
              🚪 Logout
            </button>

          </div>


          {/* STATISTICS */}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">

            <div className="bg-zinc-900 border border-blue-500/30 rounded-xl p-4 text-center">
              <div className="text-xl">👥</div>

              <p className="text-xl font-bold text-blue-400">
                {loading ? "..." : stats.users}
              </p>

              <p className="text-xs text-gray-400">
                Users
              </p>
            </div>


            <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-4 text-center">
              <div className="text-xl">💬</div>

              <p className="text-xl font-bold text-purple-400">
                {loading ? "..." : stats.posts}
              </p>

              <p className="text-xs text-gray-400">
                Posts
              </p>
            </div>


            <div className="bg-zinc-900 border border-cyan-500/30 rounded-xl p-4 text-center">
              <div className="text-xl">📝</div>

              <p className="text-xl font-bold text-cyan-400">
                {loading ? "..." : stats.comments}
              </p>

              <p className="text-xs text-gray-400">
                Comments
              </p>
            </div>


            <div className="bg-zinc-900 border border-pink-500/30 rounded-xl p-4 text-center">
              <div className="text-xl">❤️</div>

              <p className="text-xl font-bold text-pink-400">
                {loading ? "..." : stats.likes}
              </p>

              <p className="text-xs text-gray-400">
                Likes
              </p>
            </div>


            <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-4 text-center">
              <div className="text-xl">🚩</div>

              <p className="text-xl font-bold text-red-400">
                {loading ? "..." : stats.reports}
              </p>

              <p className="text-xs text-gray-400">
                Reports
              </p>
            </div>


            <div className="bg-zinc-900 border border-orange-500/30 rounded-xl p-4 text-center">
              <div className="text-xl">🔨</div>

              <p className="text-xl font-bold text-orange-400">
                {loading ? "..." : stats.banned}
              </p>

              <p className="text-xs text-gray-400">
                Banned
              </p>
            </div>

          </div>


          {/* MODERATION */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 mb-12">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              🛡️ Community Moderation
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

              <Link
                href="/admin/users"
                className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
              >
                👥 Users
              </Link>


              <Link
                href="/admin/reports"
                className="bg-red-600 rounded-xl p-5 text-center hover:bg-red-500 transition font-bold"
              >
                🚩 Reports
              </Link>


              <Link
                href="/admin/news"
                className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
              >
                📰 News
              </Link>


              <Link
                href="/admin/lore"
                className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
              >
                📜 Lore
              </Link>


              <Link
                href="/community"
                className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
              >
                💬 Community
              </Link>

            </div>

          </div>


          {/* ADMIN RESPONSIBILITIES */}

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 mb-12">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              📋 Admin Responsibilities
            </h2>

            <div className="space-y-4 text-gray-300">

              <div className="flex gap-3">
                <span>👥</span>
                <span>Review and manage community users.</span>
              </div>

              <div className="flex gap-3">
                <span>🚩</span>
                <span>Review reports submitted by users.</span>
              </div>

              <div className="flex gap-3">
                <span>🔨</span>
                <span>Ban or unban users when necessary.</span>
              </div>

              <div className="flex gap-3">
                <span>📰</span>
                <span>Create and manage ALAMATIKA news.</span>
              </div>

              <div className="flex gap-3">
                <span>📜</span>
                <span>Create and manage ALAMATIKA lore.</span>
              </div>

            </div>

          </div>


          {/* NOTICE */}

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-12">

            <h2 className="font-bold text-yellow-400 mb-2">
              👑 Creator Authority
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed">
              Administrators manage the community, but the Creator retains
              full control over administrator privileges and ALAMATIKA
              core content.
            </p>

          </div>


          <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
            © Alamatika. All Rights Reserved.
            <br />
            Admin Panel
          </footer>

        </section>

      </main>
    </AdminGuard>
  );
}