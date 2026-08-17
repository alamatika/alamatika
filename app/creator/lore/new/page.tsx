"use client";

import Link from "next/link";
import CreatorGuard from "../../../../components/CreatorGuard";
import Navbar from "../../../../components/navbar";
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

export default function NewLore() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  async function saveLore() {
    const { error } = await supabase
      .from("lore")
      .insert({
        title,
        category,
        image,
        description,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Lore saved!");

    window.location.href = "/creator/lore";
  }

  return (
    <CreatorGuard>
    <main>
      <section className="max-w-4xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

        <Link
          href="/creator"
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
        >
          🏠 Creator Studio
        </Link>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mb-10">
          New Lore Entry
        </h1>

        <div className="space-y-6">

          {/* IMAGE UPLOAD */}

          <div className="space-y-3">

            <label
              htmlFor="lore-image"
              className="w-64 h-80 max-w-full rounded-2xl border-2 border-dashed border-yellow-500 hover:bg-zinc-900 transition flex items-center justify-center overflow-hidden cursor-pointer"
            >

              {image ? (
                <img
                  src={image}
                  alt="Lore Image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-400 px-4">

                  <p className="text-6xl mb-4">
                    📖
                  </p>

                  <p className="font-semibold">
                    Click to Upload Image
                  </p>

                  <p className="text-sm mt-2 text-gray-500">
                    JPG • PNG • WEBP
                  </p>

                </div>
              )}

            </label>

            <input
              id="lore-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {

                const file = e.target.files?.[0];

                if (!file) return;

                const filename = `${Date.now()}-${file.name}`;

                const { error } = await supabase.storage
                  .from("lore")
                  .upload(filename, file);

                if (error) {
                  alert(error.message);
                  return;
                }

                const { data } = supabase.storage
                  .from("lore")
                  .getPublicUrl(filename);

                setImage(data.publicUrl);
              }}
            />

            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                className="text-red-400 hover:text-red-300 transition"
              >
                🗑 Remove Image
              </button>
            )}

          </div>

          {/* TITLE */}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
          />

          {/* CATEGORY */}

          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
          />

          {/* DESCRIPTION */}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition resize-y"
          />

          {/* SAVE */}

          <button
            onClick={saveLore}
            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold transition"
          >
            💾 Save Lore
          </button>

        </div>

        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
          © Alamatika. All Rights Reserved.
          <br />
          Version 1.0.0
        </footer>

      </section>
    </main>
    </CreatorGuard>
  );
}