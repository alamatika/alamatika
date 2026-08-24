"use client";

import Link from "next/link";
import Navbar from "../../components/navbar";
import { useState } from "react";
import { useRouter} from "next/navigation";
import { supabase } from "../../lib/supabaseClient";


export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

async function handleLogin() {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "/";
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile error:", profileError);
    window.location.href = "/";
    return;
  }

  alert("Welcome back to Alamatika!");

  if (profile?.is_admin) {
    window.location.href = "/admin";
  } else {
    window.location.href = "/";
  }
}

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6">
      <Navbar />

      <section className="max-w-md mx-auto pt-24 md:pt-32">

        <h1 className="text-3xl md:text-5xl font-bold text-yellow-400">
          Member Login
        </h1>

        <p className="text-gray-400 mt-3 text-sm md:text-base leading-6">
          Sign in to comment, bookmark chapters, and join the Alamatika community.
        </p>
        <div className="mt-10 space-y-6">

  <input
  type="email"
  placeholder="Email Address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 md:px-5 md:py-4 text-sm md:text-base focus:outline-none focus:border-yellow-400"
/>

  <input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 md:px-5 md:py-4 text-sm md:text-base focus:outline-none focus:border-yellow-400"
/>

  <Link
  href="/forgot-password"
  className="block text-right text-sm text-gray-500 hover:text-yellow-400 transition"
>
  Forgot Password?
</Link>

  <button
    onClick={handleLogin}
    className="w-full bg-yellow-500 text-black font-bold py-3 md:py-4 rounded-xl hover:bg-yellow-400 transition"
  >
    Sign In
  </button>

  <p className="text-center text-gray-400 text-sm mt-6">
  Don not have an account?{" "}
  <Link
    href="/register"
    className="text-yellow-400 hover:text-yellow-300"
  >
    Register here
  </Link>
</p>

  

  <Link
  href="/register"
  className="block w-full text-center border border-yellow-500 text-yellow-400 font-bold py-4 rounded-xl hover:bg-yellow-500 hover:text-black transition"
>
  Create Account
</Link>

  

</div>

      </section>
      

    </main>
  );
}