"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/navbar";
import Link from "next/link";

type LoreEntry = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
};


export default function Lore() {

  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [appearance, setAppearance] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadLore() {

      const { data: appearanceRows } = await supabase
  .from("appearance")
  .select("*");

const map: Record<string, string> = {};

appearanceRows?.forEach((item) => {
  map[item.key] = item.value;
});

setAppearance(map);

      const { data } = await supabase
        .from("lore")
        .select("*")
        .order("title");

      setLoreEntries(data ?? []);
    }

    loadLore();
  }, []);

  return (
  
    
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white pt-32 px-6"
      style={{
        backgroundImage: `url(${
  appearance.lore_background ??
  "/backgrounds/lore.jpg"
})`
      }}
    >
      <Navbar />

      <section className="max-w-6xl mx-auto">

        <h1 className="text-3xl md:text-5xl font-bold text-center text-yellow-400 mb-4">
          Lore
        </h1>

        <p className="text-center text-sm md:text-base text-gray-300 mb-10 md:mb-16 px-2">
          Explore the myths, legends, creatures, and beliefs of the Philippines.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">

  {loreEntries.map((entry) => (

    

    <Link
      key={entry.id}
      href={`/lore/${entry.id}`}
      className="bg-black/50 rounded-3xl p-5 md:p-8 border border-yellow-500/20 hover:scale-[1.02] transition"
    >

      <h2 className="text-xl md:text-2xl font-bold text-yellow-400">
        {entry.title}
      </h2>

      <p className="text-sm text-yellow-200 mt-2">
        {entry.category}
      </p>

      <p className="text-sm md:text-base text-gray-300 mt-4 line-clamp-3">
        {entry.description}
      </p>

    </Link>

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