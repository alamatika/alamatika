"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";

export default function CreatorPortal() {
    const router = useRouter();

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-md mx-auto pt-36 px-6">

        <h1 className="text-5xl font-bold text-yellow-400 text-center">
          Creator Portal
        </h1>

        <p className="text-center text-gray-400 mt-4 mb-10">
          Welcome back.
        </p>

        <div className="space-y-6">

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-yellow-500/30 p-4 outline-none focus:border-yellow-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-yellow-500/30 p-4 outline-none focus:border-yellow-400"
          />

          <button
          onClick={async () => {
            if (
                username === "alamatikacreation" &&
                password === "AdGalasecreto92min"
            ) {
          setError("");
          router.push("/admin");
            } else{
                setError( "Invalid username or password.");
            }
          }}
            className="w-full rounded-xl bg-yellow-500 text-black font-bold py-4 hover:bg-yellow-400 transition"
          >
            ENTER
          </button>

          {error && (
            <p className="text-red-400 text-center mt-4">
                {error}
            </p>
          )}

        </div>

      <footer className="mt-24 mb-10 text-black-600 text-sm text-center hover:text-black transition">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>
      
      </section>
    </main>
  );
}
