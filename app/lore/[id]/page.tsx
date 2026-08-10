"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import Navbar from "../../../components/navbar";
import Link from "next/link";

type LoreEntry = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
};

export default function LorePage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<LoreEntry | null>(null);

  useEffect(() => {
    async function loadLore() {

      const { data, error } = await supabase
        .from("lore")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setEntry(data);
      setLoading(false);
    }

    if (id) {
      loadLore();
    }

  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Lore...
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Lore not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-5xl mx-auto pt-24 md:pt-32 px-4 md:px-6">

        <Link
          href="/lore"
          className="text-sm md:text-base text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to Lore
        </Link>

        <div className="mt-10">

          {entry.image && (

            <img
              src={entry.image}
              alt={entry.title}
              className="w-full rounded-3xl border border-yellow-500 max-w-3xl mx-auto"
            />

          )}

          <p className="mt-8 text-yellow-400 font-semibold uppercase tracking-widest text-xs md:text-sm">
            {entry.category}
          </p>

          <h1 className="text-3xl md:text-5xl font-bold mt-3">
            {entry.title}
          </h1>

          <div className="mt-8 md:mt-10 text-base md:text-lg leading-8 md:leading-9 whitespace-pre-wrap text-gray-300">
            {entry.description}
          </div>

        </div>

      </section>

    </main>
  );
}