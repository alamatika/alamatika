"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import AdminGuard from "../../../../components/AdminGuard";
import Navbar from "../../../../components/navbar";

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

export default function EditCharacterPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [race, setRace] = useState("");
  const [description, setDescription] = useState("");
  const [portrait, setPortrait] = useState("");

  // Extract the Storage file path from the public URL
  function getStoragePath(url: string) {
    if (!url) return null;

    const marker = "/storage/v1/object/public/characters/";

    const index = url.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(
      url.substring(index + marker.length)
    );
  }

  // Delete a portrait file from Supabase Storage
  async function deletePortraitFile(url: string) {
    const path = getStoragePath(url);

    if (!path) return;

    const { error } = await supabase.storage
      .from("characters")
      .remove([path]);

    if (error) {
      console.error("Error deleting portrait:", error);
    }
  }

  async function saveCharacter() {
    const { data: currentCharacter, error: loadError } =
      await supabase
        .from("characters")
        .select("portrait")
        .eq("id", id)
        .single();

    if (loadError) {
      alert(loadError.message);
      return;
    }

    const oldPortrait = currentCharacter?.portrait ?? "";

    const { error } = await supabase
      .from("characters")
      .update({
        name,
        nickname,
        age,
        height,
        race,
        description,
        portrait,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    // If the portrait was changed, delete the old file
    if (
      oldPortrait &&
      oldPortrait !== portrait
    ) {
      await deletePortraitFile(oldPortrait);
    }

    alert("Character updated!");

    window.location.href = "/admin/characters";
  }

  async function deleteCharacter() {
    const confirmed = confirm(
      "Are you sure you want to delete this character?"
    );

    if (!confirmed) return;

    // Get the current portrait before deleting the database row
    const { data: currentCharacter, error: loadError } =
      await supabase
        .from("characters")
        .select("portrait")
        .eq("id", id)
        .single();

    if (loadError) {
      alert(loadError.message);
      return;
    }

    const portraitToDelete =
      currentCharacter?.portrait ?? "";

    // Delete the database record
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    // Delete the portrait file from Storage
    if (portraitToDelete) {
      await deletePortraitFile(portraitToDelete);
    }

    alert("Character deleted!");

    window.location.href = "/admin/characters";
  }

  async function removePortrait() {
    if (!portrait) return;

    const oldPortrait = portrait;

    // Remove the URL from the database first
    const { error } = await supabase
      .from("characters")
      .update({
        portrait: "",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setPortrait("");

    // Then remove the actual Storage file
    await deletePortraitFile(oldPortrait);
  }

  async function uploadPortrait(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const oldPortrait = portrait;

    const filename =
      `${Date.now()}-${file.name}`;

    const { error: uploadError } =
      await supabase.storage
        .from("characters")
        .upload(filename, file);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("characters")
      .getPublicUrl(filename);

    const newPortrait = data.publicUrl;

    // Update the database with the new portrait
    const { error: updateError } =
      await supabase
        .from("characters")
        .update({
          portrait: newPortrait,
        })
        .eq("id", id);

    if (updateError) {
      alert(updateError.message);

      // New file was uploaded but couldn't be linked,
      // so clean it up.
      await supabase.storage
        .from("characters")
        .remove([filename]);

      return;
    }

    setPortrait(newPortrait);

    // Delete the old file after the new one is safely linked
    if (
      oldPortrait &&
      oldPortrait !== newPortrait
    ) {
      await deletePortraitFile(oldPortrait);
    }
  }

  useEffect(() => {
    async function loadCharacter() {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(error);
        setLoading(false);
        return;
      }

      setName(data.name ?? "");
      setNickname(data.nickname ?? "");
      setAge(data.age ?? "");
      setHeight(data.height ?? "");
      setRace(data.race ?? "");
      setDescription(data.description ?? "");
      setPortrait(data.portrait ?? "");

      setLoading(false);
    }

    if (id) {
      loadCharacter();
    }
  }, [id]);

  if (loading) {
    return (
      <AdminGuard>
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading character...
        </main>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-4xl mx-auto pt-32 px-6">

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            🏠 Creator Studio
          </Link>

          <h1 className="text-5xl font-bold text-yellow-400 mb-10">
            Edit Character
          </h1>

          <div className="space-y-6">

            {/* PORTRAIT */}

            <div className="space-y-5">

              <h2 className="text-2xl font-bold text-yellow-400">
                Character Portrait
              </h2>

              <label className="block cursor-pointer w-64 h-80">

                <div className="w-64 h-80 rounded-2xl border-2 border-dashed border-yellow-500 hover:bg-zinc-900 transition flex items-center justify-center overflow-hidden">

                  {portrait ? (
                    <img
                      src={portrait}
                      alt={name || "Portrait"}
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
                  onChange={uploadPortrait}
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
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Character Name"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            {/* NICKNAME */}

            <input
              value={nickname}
              onChange={(e) =>
                setNickname(e.target.value)
              }
              placeholder="Nickname"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            {/* AGE */}

            <input
              value={age}
              onChange={(e) =>
                setAge(e.target.value)
              }
              placeholder="Age"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            {/* HEIGHT */}

            <input
              value={height}
              onChange={(e) =>
                setHeight(e.target.value)
              }
              placeholder="Height"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            {/* RACE */}

            <input
              value={race}
              onChange={(e) =>
                setRace(e.target.value)
              }
              placeholder="Race"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            {/* DESCRIPTION */}

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Description"
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            {/* ACTIONS */}

            <div className="flex flex-col sm:flex-row gap-4">

              <button
                onClick={saveCharacter}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold"
              >
                💾 Update Character
              </button>

              <button
                onClick={deleteCharacter}
                className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-bold"
              >
                🗑 Delete Character
              </button>

            </div>

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