"use client";

import AdminGuard from "../../../components/AdminGuard";
import Navbar from "../../../components/navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Character = {
  id: number;
  name: string;
  nickname: string;
  age: string;
  height: string;
  race: string;
  description: string;
  portrait: string;
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    async function loadCharacters() {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("name");

      if (error || !data) {
        console.error(error);
        return;
      }

      setCharacters(data);
    }

    loadCharacters();
  }, []);

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6 pb-20">

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            🏠 Creator Studio
          </Link>

          {/* HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-10">

            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400">
                Characters
              </h1>

              <p className="text-gray-400 mt-2">
                Manage every ALAMATIKA character.
              </p>
            </div>

            <Link
              href="/admin/characters/new"
              className="inline-flex items-center justify-center bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
            >
              ➕ New Character
            </Link>

          </div>

          {/* CHARACTER LIST */}

          <div className="space-y-4">

            {characters.length === 0 && (
              <div className="bg-zinc-900 rounded-2xl p-8 text-center text-gray-400">
                No characters yet.
              </div>
            )}

            {characters.map((character) => (

              <div
                key={character.id}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 sm:p-6"
              >

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

                  {/* CHARACTER INFO */}

                  <div className="flex items-center gap-4 sm:gap-5 min-w-0">

                    {character.portrait ? (
                      <img
                        src={character.portrait}
                        alt={character.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl shrink-0">
                        👤
                      </div>
                    )}

                    <div className="min-w-0">

                      <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 truncate">
                        {character.name}
                      </h2>

                      {character.nickname && (
                        <p className="text-gray-400 truncate">
                          {character.nickname}
                        </p>
                      )}

                      {character.race && (
                        <p className="text-sm text-gray-500 truncate">
                          {character.race}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* EDIT BUTTON */}

                  <Link
                    href={`/admin/characters/${character.id}`}
                    className="inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold transition w-full sm:w-auto"
                  >
                    ✏️ Edit
                  </Link>

                </div>

              </div>

            ))}

          </div>

          {/* FOOTER */}

          <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
            © Alamatika. All Rights Reserved.
            <br />
            Version 1.0.0
          </footer>

        </section>
      </main>
    </AdminGuard>
  );
}