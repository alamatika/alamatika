"use client";

import Navbar from "../../components/navbar";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {

    const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

async function saveNewPassword() {
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password updated successfully!");

  window.location.href = "/";
}

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-md mx-auto pt-32 px-6">

        <h1 className="text-5xl font-bold text-yellow-400">
          Reset Password
        </h1>

        <p className="text-gray-400 mt-3">
          Enter your new password below.
        </p>

        <div className="mt-10 space-y-6">

          <input
  type="password"
  placeholder="New Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 focus:outline-none focus:border-yellow-400"
/>

          <input
  type="password"
  placeholder="Confirm Password"
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 focus:outline-none focus:border-yellow-400"
/>

          <button
  onClick={saveNewPassword}
  className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition"
>
  Save New Password
</button>

        </div>

      </section>
    </main>
  );
}