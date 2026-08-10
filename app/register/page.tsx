"use client";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function RegisterPage() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {

  // Check if username already exists
  const { data: existingUser, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (checkError) {
    alert(checkError.message);
    return;
  }

  if (existingUser) {
    alert("❌ That username is already taken.\nPlease choose another username.");
    return;
  }

  // Create account
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {

    if (
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("unique")
    ) {
      alert("❌ That username is already taken.\nPlease choose another username.");
      return;
    }

    alert(error.message);
    return;
  }

  alert(
    "🎉 Account created!\n\nPlease check your email and click the verification link before logging in."
  );
}

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-md mx-auto pt-32 px-6">

        <h1 className="text-5xl font-bold text-yellow-400">
          Create Account
        </h1>

        <p className="text-gray-400 mt-3">
          Join the Alamatika community and become part of the journey.
        </p>

        <div className="mt-10 space-y-6">

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 focus:outline-none focus:border-yellow-400"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 focus:outline-none focus:border-yellow-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 focus:outline-none focus:border-yellow-400"
          />

          <button
          onClick={handleRegister}
          className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition"
         >
           Create Account
          </button>
          <div className="text-center mt-6">
  <Link
    href="/login"
    className="text-yellow-400 hover:text-yellow-300"
  >
    Already have an account? Sign In
  </Link>
</div>


        </div>

      </section>
    </main>
  );
}
