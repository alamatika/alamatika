"use client";

import Link from "next/link";
import Navbar from "../../components/navbar";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ForgotPasswordPage() {

const [email, setEmail] = useState("");

async function sendResetLink() {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password reset email sent!");
}

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-md mx-auto pt-32 px-6">

        <h1 className="text-5xl font-bold text-yellow-400">
          Forgot Password
        </h1>

        <p className="text-gray-400 mt-3">
          Enter your email address and we will send you a password reset link.
        </p>

        <div className="mt-10 space-y-6">

          <input
  type="email"
  placeholder="Email Address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 focus:outline-none focus:border-yellow-400"
/>

          <button
  onClick={sendResetLink}
  className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition"
>
  Send Reset Link
</button>

          <Link
            href="/login"
            className="block text-center text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Login
          </Link>

        </div>

      </section>

    </main>
  );
}