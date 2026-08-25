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
  const [search, setSearch] = useState("");
const [page, setPage] = useState(1);
const [totalLore, setTotalLore] = useState(0);
const [loadingLore, setLoadingLore] = useState(false);

const lorePerPage = 10;
  const [appearance, setAppearance] = useState<Record<string, string>>({});

  useEffect(() => {
  let cancelled = false;

  async function initialLoad() {
    setLoadingLore(true);

    try {
      const { data: appearanceRows } =
        await supabase
          .from("appearance")
          .select("*");

      const appearanceMap: Record<
        string,
        string
      > = {};

      appearanceRows?.forEach((item) => {
        appearanceMap[item.key] = item.value;
      });

      if (!cancelled) {
        setAppearance(appearanceMap);
      }

      const {
        data,
        error,
        count,
      } = await supabase
        .from("lore")
        .select("*", {
          count: "exact",
        })
        .order("title")
        .range(0, lorePerPage - 1);

      if (error) {
        console.error(error);
        return;
      }

      if (!cancelled) {
        setLoreEntries(data ?? []);
        setTotalLore(count ?? 0);
        setPage(1);
      }
    } finally {
      if (!cancelled) {
        setLoadingLore(false);
      }
    }
  }

  initialLoad();

  return () => {
    cancelled = true;
  };
}, []);

async function loadLore(
  targetPage: number,
  searchTerm = search
) {
  setLoadingLore(true);

  try {
    const from =
      (targetPage - 1) *
      lorePerPage;

    const to =
      from +
      lorePerPage -
      1;

    let query = supabase
      .from("lore")
      .select("*", {
        count: "exact",
      })
      .order("title")
      .range(from, to);

    const trimmedSearch =
      searchTerm.trim();

    if (trimmedSearch) {
      query = query.or(
        `title.ilike.%${trimmedSearch}%,category.ilike.%${trimmedSearch}%`
      );
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      console.error(error);
      return;
    }

    setLoreEntries(data ?? []);
    setTotalLore(count ?? 0);
    setPage(targetPage);
  } finally {
    setLoadingLore(false);
  }
}

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
          Explore the myths, legends, creatures, and beliefs
        </p>

        <div className="max-w-xl mx-auto mb-8">

  <div className="flex gap-2">

    <input
      type="text"
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          loadLore(1, search);
        }
      }}
      placeholder="🔎 Search lore..."
      className="flex-1 rounded-xl bg-zinc-900/80 border border-zinc-700 px-4 py-3 text-sm md:text-base focus:outline-none focus:border-yellow-400"
    />

    <button
      type="button"
      onClick={() =>
        loadLore(1, search)
      }
      className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
    >
      Search
    </button>

  </div>

</div>

        {loadingLore ? (

  <div className="text-center text-gray-500 py-16">
    Loading lore...
  </div>

) : loreEntries.length === 0 ? (

  <div className="text-center text-gray-500 py-16">
    No lore found.
  </div>

) : (

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
)}

{totalLore > lorePerPage && (

  <div className="flex flex-wrap justify-center items-center gap-2 mt-10">

    <button
      type="button"
      disabled={page === 1}
      onClick={() =>
        loadLore(
          page - 1,
          search
        )
      }
      className="px-3 py-2 rounded-lg border border-zinc-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      ←
    </button>

    {Array.from(
      {
        length: Math.ceil(
          totalLore /
            lorePerPage
        ),
      },
      (_, index) => {
        const pageNumber =
          index + 1;

        return (
          <button
            key={pageNumber}
            type="button"
            onClick={() =>
              loadLore(
                pageNumber,
                search
              )
            }
            className={`min-w-9 px-3 py-2 rounded-lg font-bold transition ${
              page === pageNumber
                ? "bg-yellow-500 text-black"
                : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
            }`}
          >
            {pageNumber}
          </button>
        );
      }
    )}

    <button
      type="button"
      disabled={
        page >=
        Math.ceil(
          totalLore /
            lorePerPage
        )
      }
      onClick={() =>
        loadLore(
          page + 1,
          search
        )
      }
      className="px-3 py-2 rounded-lg border border-zinc-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      →
    </button>

  </div>

)}


        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

      </section>

    </main>
  );
}