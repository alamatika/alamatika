"use client";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function RegisterPage() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showConfirmation, setShowConfirmation] =
  useState(false);
  const [showPassword, setShowPassword] =
  useState(false);

  async function handleRegister() {

      if (!acceptedTerms) {
        setPassword("");
  setShowConfirmation(true);
  return;
}


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
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      terms_version: "1.0",
      privacy_accepted: true,
      privacy_accepted_at: new Date().toISOString(),
      privacy_version: "1.0",
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

          <div className="relative">

  <input
    type={
      showPassword
        ? "text"
        : "password"
    }
    placeholder="Password"
    value={password}
    onChange={(e) =>
      setPassword(e.target.value)
    }
    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-4 pr-14 focus:outline-none focus:border-yellow-400"
  />

  <button
    type="button"
    onClick={() =>
      setShowPassword(
        (current) => !current
      )
    }
    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition"
    aria-label={
      showPassword
        ? "Hide password"
        : "Show password"
    }
  >
    {showPassword ? "🙈" : "👁️"}
  </button>

</div>

          <div className="flex items-start gap-3">
  <input
    id="acceptedTerms"
    type="checkbox"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
    className="mt-1 w-5 h-5 accent-yellow-500 cursor-pointer"
  />

  <label
    htmlFor="acceptedTerms"
    className="text-sm text-gray-400 leading-6 cursor-pointer"
  >
    I agree to the{" "}
    <Link
      href="/terms"
      target="_blank"
      className="text-yellow-400 hover:text-yellow-300 underline"
    >
      Terms of Service
    </Link>{" "}
    and{" "}
    <Link
      href="/privacy"
      target="_blank"
      className="text-yellow-400 hover:text-yellow-300 underline"
    >
      Privacy Policy
    </Link>
    .
  </label>
</div>

          <button
  onClick={handleRegister}
  disabled={!acceptedTerms}
  className={`w-full font-bold py-4 rounded-xl transition ${
    acceptedTerms
      ? "bg-yellow-500 text-black hover:bg-yellow-400"
      : "bg-zinc-700 text-gray-500 cursor-not-allowed"
  }`}
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

{showConfirmation && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">

    <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-yellow-500/40 shadow-2xl p-8 text-center">

      <div className="text-5xl mb-4">
        📧
      </div>

      <h2 className="text-2xl font-bold text-yellow-400">
        Account Created!
      </h2>

      <p className="text-gray-300 mt-4 leading-7">
        Your Alamatika account has been created.
      </p>

      <p className="text-gray-400 mt-2 leading-7">
        Please check your email and click the
        verification link before logging in.
      </p>

      <button
        type="button"
        onClick={() => {
          setShowConfirmation(false);
        }}
        className="mt-6 w-full py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
      >
        Got It
      </button>

    </div>

  </div>
)}

    </main>
  );
}
