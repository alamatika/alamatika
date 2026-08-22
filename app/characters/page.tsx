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

  useEffect(() => {

    async function loadCharacters() {

  const { data: appearanceRows } = await supabase
    .from("appearance")
    .select("*");

  const map: Record<string, string> = {};

  appearanceRows?.forEach((item) => {
    map[item.key] = item.value;
  });

  setAppearance(map);

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("name");

  if (error) {
    console.error(error);
    return;
  }

  setCharacters(data);
}

    loadCharacters();

  }, []);

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
      <div className="flex justify-center">
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full">
  {characters.map((character) => (
    <CharacterCard
      key={character.id}
      name={character.name}
      title={character.nickname}
      image={character.portrait || "/characters/placeholder.png"}
      link={`/characters/${character.id}`}
    />
  ))}
</div>
</div>
        
      </section>

      <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>
      
    </main>
  );
}