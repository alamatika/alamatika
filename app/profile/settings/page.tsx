"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function ProfileSettings() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    }

    loadUser();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="max-w-2xl mx-auto pt-32 px-6">

        <div className="bg-zinc-900 rounded-2xl p-10">

          <h1 className="text-4xl font-bold text-yellow-400 mb-3">
            ⚙️ Account Settings
          </h1>

          <p className="text-gray-400 mb-8">
            Manage your profile, security, and account.
          </p>

          <div className="space-y-4">

            {/* EDIT PROFILE */}

            <Link
              href="/profile/edit"
              className="block rounded-xl bg-zinc-800 hover:bg-zinc-700 p-5 transition"
            >
              <div className="flex justify-between items-center">

                <div>
                  <h3 className="text-yellow-400 font-bold">
                    ✏️ Edit Profile
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Change your username, bio, avatar, and profile information.
                  </p>
                </div>

                <span className="text-yellow-400 font-bold">
                  →
                </span>

              </div>
            </Link>


            {/* SECURITY */}

            <Link
              href="/profile/settings/password"
              className="block rounded-xl bg-zinc-800 hover:bg-zinc-700 p-5 transition"
            >
              <div className="flex justify-between items-center">

                <div>
                  <h3 className="text-yellow-400 font-bold">
                    🔑 Change Password
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Change the password used to protect your account.
                  </p>
                </div>

                <span className="text-yellow-400 font-bold">
                  →
                </span>

              </div>
            </Link>


            {/* DELETE ACCOUNT */}

            <Link
              href="/profile/settings/delete"
              className="block rounded-2xl border border-red-500/30 bg-zinc-800 p-6 hover:border-red-500 hover:bg-zinc-700 transition"
            >
              <div className="flex justify-between items-center">

                <div>
                  <h3 className="text-red-400 font-bold">
                    🗑️ Delete Account
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Permanently delete your account and its data.
                  </p>
                </div>

                <div className="text-red-400 font-bold">
                  →
                </div>

              </div>
            </Link>

          </div>


          {/* BACK TO PROFILE */}

          {userId && (
            <Link
              href={`/profile/${userId}`}
              className="inline-block mt-10 text-yellow-400 hover:text-yellow-300"
            >
              ← Back to Profile
            </Link>
          )}

        </div>

      </div>

    </main>
  );
}