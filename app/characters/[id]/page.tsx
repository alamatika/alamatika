"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import Navbar from "../../../components/navbar";

type Character = {
  id: number;
  name: string;
  nickname: string;
  portrait: string;
  age: string;
  height: string;
  race: string;
  description: string;
};

export default function CharacterPage() {
  const { id } = useParams();

  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    async function loadCharacter() {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setCharacter(data);
    }

    if (id) loadCharacter();
  }, [id]);

  if (!character) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage: "url('/backgrounds/home-v3.jpg')",
      }}
    >
      <Navbar />

      <section className="max-w-6xl mx-auto pt-24 md:pt-36 px-4 md:px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          <div>

            <img
              src={character.portrait}
              alt={character.name}
              className="rounded-3xl border-4 border-yellow-500 w-full max-w-sm mx-auto md:max-w-full"
            />

          </div>

          <div>

            <h1 className="text-3xl md:text-5xl font-bold text-yellow-400 text-center md:text-left">
              {character.name}
            </h1>

            <p className="text-lg md:text-2xl text-gray-300 mt-2 text-center md:text-left">
              {character.nickname}
            </p>

            <div className="mt-8 md:mt-10 space-y-3 text-base md:text-lg">

              <p>
                <span className="font-bold text-yellow-400">Age:</span>{" "}
                {character.age}
              </p>

              <p>
                <span className="font-bold text-yellow-400">Height:</span>{" "}
                {character.height}
              </p>

              <p>
                <span className="font-bold text-yellow-400">Race:</span>{" "}
                {character.race}
              </p>

            </div>

            <div className="mt-10">

              <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-4">
                Description
              </h2>

              <p className="text-gray-300 leading-7 md:leading-8 whitespace-pre-wrap text-sm md:text-base">
                {character.description}
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}