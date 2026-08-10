"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AccountSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully!");

    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="min-h-screen bg-black text-white pt-32 px-6">

      <div className="max-w-xl mx-auto">

        <h1 className="text-5xl font-bold text-yellow-400 mb-10">
          👤 Account Settings
        </h1>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-yellow-500/20">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            Change Password
          </h2>

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
            className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 mb-4"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 mb-6"
          />

          <button
            onClick={changePassword}
            className="w-full bg-yellow-500 text-black font-bold rounded-xl py-3 hover:bg-yellow-400 transition"
          >
            Save Password
          </button>

        </div>

      </div>

    </main>
  );
}