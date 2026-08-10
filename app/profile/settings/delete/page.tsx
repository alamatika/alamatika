"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";



export default function DeleteAccountPage() {
  const [confirmText, setConfirmText] = useState("");

  const [username, setUsername] = useState("");
const [confirmUsername, setConfirmUsername] = useState("");
const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function deleteAccount() {
    setLoading(true);

    if (
  !confirm(
    "Are you absolutely sure? This action cannot be undone."
  )
) {
  setLoading(false);
  return;
}

    try {
  const response = await fetch("/api/delete-account", {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
  alert(result.message);
  return;
}

alert("Account deleted successfully.");

  await supabase.auth.signOut();

  router.push("/");
} finally {
    setLoading(false);
}
}

useEffect(() => {
  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    setUsername(data?.username ?? "");
  }

  loadProfile();
}, []);

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="max-w-xl mx-auto pt-32 px-6">

        <div className="bg-zinc-900 rounded-2xl p-10">

          <h1 className="text-4xl font-bold text-red-500 mb-6">
            ⚠ Delete Account
          </h1>

          <p className="text-gray-300 leading-8 mb-8">
            Deleting your account is permanent.
            <br />
            All of your data will be removed forever.
          </p>

          <div className="bg-red-950 border border-red-600 rounded-xl p-5 mb-8">

            <p className="font-bold text-red-400 mb-3">
              This will permanently delete:
            </p>

            <ul className="space-y-2 text-gray-300">

              <li>• Your profile</li>
              <li>• Community posts</li>
              <li>• Comments</li>
              <li>• Ratings</li>
              <li>• Wallet history</li>
              <li>• Credits</li>
              <li>• Unlocked chapters</li>
              <li>• Messages</li>

            </ul>

          </div>

          <p className="text-gray-400 mb-2">
Type your username:
</p>

<p className="font-bold text-yellow-400 mb-3">
{username}
</p>

<input
  value={confirmUsername}
  onChange={(e) => setConfirmUsername(e.target.value)}
  className="w-full rounded-xl bg-black border border-zinc-700 px-5 py-4 mb-6"
/>

          <p className="mb-3 text-gray-400">
            Type <span className="font-bold text-red-400">DELETE</span> to continue.
          </p>

          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-xl bg-black border border-zinc-700 px-5 py-4"
          />

          <button
            disabled={
  confirmText !== "DELETE" ||
  confirmUsername !== username ||
  loading
}
            onClick={deleteAccount}
            className={`mt-8 w-full rounded-xl py-4 font-bold transition ${
  confirmText === "DELETE" &&
  confirmUsername === username &&
  !loading
    ? "bg-red-600 hover:bg-red-500"
    : "bg-zinc-700 cursor-not-allowed"
}`}
          >
            {loading ? "Deleting..." : "Delete My Account"}
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