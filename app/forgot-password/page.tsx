
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
const [resending, setResending] = useState(false);
const [resent, setResent] = useState(false);

async function requestAnotherLink() {
  if (!email.trim()) {
    alert("Please enter your account email.");
    return;
  }

  setResending(true);

  try {
    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/reset-password`,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    setResent(true);
  } finally {
    setResending(false);
  }
}

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setReady(!!session);
      setChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setReady(!!session);
        setChecking(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword() {
    if (!password) {
      alert("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      alert(
        "Your password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        alert(error.message);
        return;
      }

      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking reset link...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6">

      <Navbar />

      <section className="max-w-md mx-auto pt-24 md:pt-32">

        {success ? (

          <div className="bg-zinc-900 rounded-2xl p-8 border border-green-500/30">

            <h1 className="text-3xl font-bold text-green-400">
              ✅ Password Updated
            </h1>

            <p className="text-gray-400 mt-4 leading-6">
              Your password has been changed successfully.
              You can now sign in with your new password.
            </p>

            <Link
              href="/login"
              className="inline-block mt-6 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition"
            >
              Go to Login
            </Link>

          </div>

        ) : !ready ? (

          <div className="bg-zinc-900 rounded-2xl p-8 border border-red-500/30">

  <h1 className="text-3xl font-bold text-red-400">
    Reset Link Invalid
  </h1>

  <p className="text-gray-400 mt-4 leading-6">
    This password reset link may have expired
    or is no longer valid.
  </p>

  {resent ? (
    <p className="mt-6 text-green-400 font-semibold">
      ✅ A new reset link has been sent.
      Check your email.
    </p>
  ) : (
    <div className="mt-6 space-y-4">

      <input
        type="email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        placeholder="Email Address"
        className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 focus:outline-none focus:border-yellow-400"
      />

      <button
        type="button"
        onClick={requestAnotherLink}
        disabled={resending}
        className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50"
      >
        {resending
          ? "Sending..."
          : "📩 Request Another Link"}
      </button>

    </div>
  )}

  <Link
    href="/login"
    className="block text-center mt-5 text-gray-500 hover:text-yellow-400"
  >
    Back to Login
  </Link>

</div>

        ) : (

          <>

            <h1 className="text-3xl md:text-5xl font-bold text-yellow-400">
              Reset Password
            </h1>

            <p className="text-gray-400 mt-3">
              Enter your new password below.
            </p>

            <div className="mt-10 space-y-5">

              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 md:px-5 md:py-4 focus:outline-none focus:border-yellow-400"
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 md:px-5 md:py-4 focus:outline-none focus:border-yellow-400"
              />

              <button
                type="button"
                onClick={updatePassword}
                disabled={saving}
                className="w-full bg-yellow-500 text-black font-bold py-3 md:py-4 rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Updating..."
                  : "🔐 Update Password"}
              </button>

            </div>

          </>

        )}

      </section>

    </main>
  );
}
