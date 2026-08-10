"use client";

import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import Link from "next/link";

export default function ChangePasswordPage() {

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function changePassword() {
  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  setLoading(true);

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  setLoading(false);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password updated successfully!");

  setNewPassword("");
}

  return (

    <main className="min-h-screen bg-black text-white">

      <div className="max-w-xl mx-auto pt-32 px-6">

        <div className="bg-zinc-900 rounded-2xl p-10">

          <h1 className="text-4xl font-bold text-yellow-400 mb-8">
            🔑 Change Password
          </h1>

          <input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  className="w-full rounded-xl bg-black border border-zinc-700 px-5 py-4"
/>

          <button
            onClick={changePassword}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-yellow-500 text-black py-4 font-bold hover:bg-yellow-400 transition"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          <Link
            href="/profile/settings"
            className="inline-block mt-8 text-yellow-400 hover:text-yellow-300"
          >
            ← Back
          </Link>

        </div>

      </div>

    </main>

  );
}