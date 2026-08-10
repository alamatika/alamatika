"use client";

import Link from "next/link";
import AdminGuard from "../../../../components/AdminGuard";
import Navbar from "../../../../components/navbar";
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

function getStoragePath(publicUrl: string) {
  if (!publicUrl) return null;

  const marker = "/storage/v1/object/public/characters/";

  const index = publicUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    publicUrl.substring(index + marker.length)
  );
}

export default function NewCharacter() {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [race, setRace] = useState("");
  const [description, setDescription] = useState("");
  const [portrait, setPortrait] = useState("");

  async function saveCharacter() {
    const { error } = await supabase
      .from("characters")
      .insert({
        name,
        nickname,
        age,
        height,
        race,
        description,
        portrait,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Character saved!");

    window.location.href = "/admin/characters";
  }

  async function removePortrait() {
    if (!portrait) return;

    const path = getStoragePath(portrait);

    if (path) {
      const { error } = await supabase.storage
        .from("characters")
        .remove([path]);

      if (error) {
        console.error("Could not delete portrait:", error);
      }
    }

    setPortrait("");
  }

  async function handlePortraitUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const filename = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("characters")
      .upload(filename, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("characters")
      .getPublicUrl(filename);

    setPortrait(data.publicUrl);
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-4xl mx-auto pt-28 md:pt-32 px-5 sm:px-6 pb-20">

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            🏠 Creator Studio
          </Link>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mb-10">
            New Character
          </h1>

          <div className="space-y-6">

            {/* PORTRAIT */}

            <div className="space-y-5">

              <h2 className="text-2xl font-bold text-yellow-400">
                Character Portrait
              </h2>

              <label className="block cursor-pointer w-fit">

                <div className="w-64 h-80 rounded-2xl border-2 border-dashed border-yellow-500 hover:bg-zinc-900 transition flex items-center justify-center overflow-hidden">

                  {portrait ? (
                    <img
                      src={portrait}
                      alt="Character portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400 p-4">

                      <p className="text-6xl mb-4">
                        👤
                      </p>

                      <p className="font-semibold">
                        Click to Upload Portrait
                      </p>

                      <p className="text-sm mt-2 text-gray-500">
                        JPG • PNG • WEBP
                      </p>

                    </div>
                  )}

                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePortraitUpload}
                />

              </label>

              {portrait && (
                <button
                  type="button"
                  onClick={removePortrait}
                  className="text-red-400 hover:text-red-300 transition"
                >
                  🗑 Remove Portrait
                </button>
              )}

            </div>

            {/* NAME */}

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character Name"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
            />

            {/* NICKNAME */}

            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
            />

            {/* AGE */}

            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
            />

            {/* HEIGHT */}

            <input
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Height"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
            />

            {/* RACE */}

            <input
              value={race}
              onChange={(e) => setRace(e.target.value)}
              placeholder="Race"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
            />

            {/* DESCRIPTION */}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
            />

            {/* SAVE */}

            <button
              onClick={saveCharacter}
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold transition"
            >
              💾 Save Character
            </button>

          </div>

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