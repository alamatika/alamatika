"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";

export default function CreatorLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/creator/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid username or password.");
        setLoading(false);
        return;
      }

      router.replace("/creator");
    } catch (error) {
      console.error("Creator login error:", error);
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-md mx-auto pt-32 px-6">

        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 text-center">
          Creator Portal
        </h1>

        <p className="text-center text-gray-400 mt-4 mb-10">
          Private access for ALAMATIKA creators.
        </p>

        <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-6 sm:p-8">

          <div className="space-y-5">

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-xl bg-black border border-zinc-700 p-4 outline-none focus:border-yellow-400 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl bg-black border border-zinc-700 p-4 outline-none focus:border-yellow-400 disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-yellow-500 text-black font-bold py-4 hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "ENTER CREATOR PORTAL"}
            </button>

          </div>

        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Private ALAMATIKA Creator Access
        </p>

      </section>
    </main>
  );
}