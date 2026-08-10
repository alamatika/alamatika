"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";
import Link from "next/link";

type Lore = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
};

export default function LoreManager() {
  const [loreEntries, setLoreEntries] = useState<Lore[]>([]);

  useEffect(() => {
    async function loadLore() {
      const { data, error } = await supabase
        .from("lore")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setLoreEntries(data ?? []);
    }

    loadLore();
  }, []);

  async function deleteLore(id: number) {
    const confirmed = confirm(
      "Are you sure you want to delete this lore?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("lore")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setLoreEntries((current) =>
      current.filter((entry) => entry.id !== id)
    );

    alert("Lore deleted!");
  }

  return (
    <main>
      <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
        >
          🏠 Creator Studio
        </Link>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400">
          Lore Manager
        </h1>

        <p className="text-gray-400 mt-3">
          Build the myths and legends of ALAMATIKA.
        </p>

        <Link href="/admin/lore/new">
          <button className="mt-10 px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition">
            ✨ New Lore Entry
          </button>
        </Link>

        <div className="mt-12 space-y-4">

          {loreEntries.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center text-gray-400">
              No lore entries yet.
            </div>
          )}

          {loreEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 sm:p-6"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                {/* LORE INFO */}

                <div className="min-w-0">

                  <h2 className="text-xl sm:text-2xl font-bold">
                    {entry.title}
                  </h2>

                  <p className="text-yellow-400 text-sm sm:text-base mt-1">
                    {entry.category}
                  </p>

                </div>

                {/* ACTIONS */}

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

                  <Link
                    href={`/admin/lore/${entry.id}`}
                    className="w-full sm:w-auto"
                  >
                    <button
                      className="w-full sm:w-auto px-5 py-2 rounded-lg border border-yellow-500 hover:bg-yellow-500 hover:text-black transition"
                    >
                      Edit
                    </button>
                  </Link>

                  <button
                    onClick={() => deleteLore(entry.id)}
                    className="w-full sm:w-auto px-5 py-2 rounded-lg border border-red-500 hover:bg-red-500 transition"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>
          ))}

        </div>

        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
          © Alamatika. All Rights Reserved.
          <br />
          Version 1.0.0
        </footer>

      </section>
    </main>
  );
}