"use client";

import Link from "next/link";

export default function ProfileSettings() {
   

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="max-w-2xl mx-auto pt-32 px-6">

        <div className="bg-zinc-900 rounded-2xl p-10">

          <h1 className="text-4xl font-bold text-yellow-400 mb-8">
            🔒 Security Settings
          </h1>

          <div className="space-y-4">

            <Link
              href="/profile/settings/password"
              className="block rounded-xl bg-zinc-800 hover:bg-zinc-700 p-5 transition"
            >
              🔑 Change Password
            </Link>

            <Link
  href="/profile/settings/delete"
  className="block mt-6 rounded-2xl border border-red-500/30 bg-zinc-800 p-6 hover:border-red-500 hover:bg-zinc-700 transition"
>
  <div className="flex justify-between items-center">

    <div>

      <h3 className="text-red-400 font-bold">
        🗑 Delete Account
      </h3>

      <p className="text-gray-500 text-sm">
        Permanently delete your account and all data.
      </p>

    </div>

    <div className="text-red-400 font-bold">
      →
    </div>

  </div>
</Link>
          </div>

          <Link
            href="/profile"
            className="inline-block mt-10 text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Profile
          </Link>

        </div>

      </div>

    </main>
  );
}