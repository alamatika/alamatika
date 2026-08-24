"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../components/navbar";
import CreatorGuard from "../../../../components/CreatorGuard";
import { supabase } from "../../../../lib/supabaseClient";
import imageCompression from "browser-image-compression";

export default function NewStory() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadCover(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadingCover(true);

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1800,
        maxSizeMB: 1,
        useWebWorker: true,
        initialQuality: 0.85,
      });

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeName =
        `story-cover-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("covers")
        .upload(safeName, compressed);

      if (error) {
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("covers")
        .getPublicUrl(safeName);

      setCoverImage(data.publicUrl);

      alert("Story cover uploaded!");
    } catch (error) {
      console.error(error);
      alert("Failed to upload story cover.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function saveStory() {
    if (!title.trim()) {
      alert("Please enter a story title.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("stories")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          cover_image: coverImage || null,
          published: true,
        });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      alert("Story created!");

      router.push("/creator/stories");
      router.refresh();

    } finally {
      setSaving(false);
    }
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">

        <Navbar />

        <section className="max-w-3xl mx-auto pt-32 px-6">

          <Link
            href="/creator/stories"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            ← Back to Stories
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
            Add Story
          </h1>

          <p className="text-gray-400 mt-3">
            Create a new manga or story.
          </p>

          <div className="space-y-6 mt-12">

            {/* STORY INFORMATION */}

            <div className="bg-zinc-900 rounded-2xl p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                📖 Story Information
              </h2>

              <div className="space-y-4">

                <input
                  type="text"
                  placeholder="Story Title"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
                />

                <textarea
                  placeholder="Story Description"
                  rows={6}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
                />

              </div>

            </div>

            {/* COVER */}

            <div className="bg-zinc-900 rounded-2xl p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                🖼 Story Cover
              </h2>

              <label className="inline-block w-full sm:w-auto text-center cursor-pointer bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition">

                📤 Choose Cover Image

                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadCover}
                  className="hidden"
                />

              </label>

              {uploadingCover && (
                <p className="mt-4 text-yellow-400">
                  ⏳ Uploading cover...
                </p>
              )}

              {coverImage && (
                <div className="mt-6">

                  <img
                    src={coverImage}
                    alt="Story Cover"
                    className="w-full max-w-md rounded-xl border border-yellow-500"
                  />

                </div>
              )}

            </div>

            {/* SAVE */}

            <button
              type="button"
              onClick={saveStory}
              disabled={!title.trim() || saving || uploadingCover}
              className="w-full py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "⏳ Creating Story..."
                : "💾 Create Story"}
            </button>

          </div>

        </section>

        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
          © Alamatika. All Rights Reserved.
          <br />
          Version 1.0.0
        </footer>

      </main>
    </CreatorGuard>
  );
}