"use client";

import { useEffect, useState } from "react";
import CharacterCard from "../../components/CharacterCard";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabaseClient";

type Character = {
  id: number;
  name: string;
  nickname: string;
  portrait: string;
};



export default function Characters() {


  const [appearance, setAppearance] = useState<Record<string,string>>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [search, setSearch] = useState("");
const [page, setPage] = useState(1);
const [totalCharacters, setTotalCharacters] = useState(0);
const [loadingCharacters, setLoadingCharacters] = useState(false);

const charactersPerPage = 10;

  useEffect(() => {
  let cancelled = false;

  async function initialLoad() {
    setLoadingCharacters(true);

    try {
      const { data: appearanceRows } =
        await supabase
          .from("appearance")
          .select("*");

      const appearanceMap: Record<string, string> = {};

      appearanceRows?.forEach((item) => {
        appearanceMap[item.key] = item.value;
      });

      if (!cancelled) {
        setAppearance(appearanceMap);
      }

      const from = 0;
      const to = charactersPerPage - 1;

      const {
        data,
        error,
        count,
      } = await supabase
        .from("characters")
        .select("*", {
          count: "exact",
        })
        .order("name")
        .range(from, to);

      if (error) {
        console.error(error);
        return;
      }

      if (!cancelled) {
        setCharacters(data ?? []);
        setTotalCharacters(count ?? 0);
        setPage(1);
      }
    } finally {
      if (!cancelled) {
        setLoadingCharacters(false);
      }
    }
  }

  initialLoad();

  return () => {
    cancelled = true;
  };
}, []);

async function loadCharacters(
  targetPage: number,
  searchTerm = search
) {
  setLoadingCharacters(true);

  try {
    const from =
      (targetPage - 1) *
      charactersPerPage;

    const to =
      from +
      charactersPerPage -
      1;

    let query = supabase
      .from("characters")
      .select("*", {
        count: "exact",
      })
      .order("name")
      .range(from, to);

    const trimmedSearch =
      searchTerm.trim();

    if (trimmedSearch) {
      query = query.ilike(
        "name",
        `%${trimmedSearch}%`
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

    setCharacters(data ?? []);
    setTotalCharacters(count ?? 0);
    setPage(targetPage);
  } finally {
    setLoadingCharacters(false);
  }
}

  return (
    <main
      className="min-h-screen pt-32 bg-cover bg-center bg-no-repeat text-white flex flex-col items-center px-6"
      style={{
        backgroundImage: `url(${
  appearance.characters_background ??
  "/backgrounds/characters.jpg"
})`
      }}
    >
      <Navbar />

      <section className="w-full max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-yellow-400 mb-10">
          Characters
        </h2>

         {/* SEARCH */}
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
            loadCharacters(1, search);
          }
        }}
        placeholder="🔎 Search characters..."
        className="flex-1 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm md:text-base focus:outline-none focus:border-yellow-400"
      />

      <button
        type="button"
        onClick={() =>
          loadCharacters(1, search)
        }
        className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
      >
        Search
      </button>

    </div>

  </div>

      {loadingCharacters ? (

  <div className="text-center text-gray-500 py-16">
    Loading characters...
  </div>

) : characters.length === 0 ? (

  <div className="text-center text-gray-500 py-16">
    No characters found.
  </div>

) : (

  <div className="flex justify-center">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full">

      {characters.map((character) => (

        <CharacterCard
          key={character.id}
          name={character.name}
          title={character.nickname}
          image={
            character.portrait ||
            "/characters/placeholder.png"
          }
          link={`/characters/${character.id}`}
        />

      ))}

    </div>
  </div>

)}

{totalCharacters > charactersPerPage && (

  <div className="flex flex-wrap justify-center items-center gap-2 mt-10">

    <button
      type="button"
      disabled={page === 1}
      onClick={() =>
        loadCharacters(
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
          totalCharacters /
            charactersPerPage
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
              loadCharacters(
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
          totalCharacters /
            charactersPerPage
        )
      }
      onClick={() =>
        loadCharacters(
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
        
      </section>

      <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>
      
    </main>
  );
}