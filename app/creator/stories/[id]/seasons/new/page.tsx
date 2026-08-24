"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../../../components/navbar";
import CreatorGuard from "../../../../../../components/CreatorGuard";
import { supabase } from "../../../../../../lib/supabaseClient";

export default function NewSeason() {
  const router = useRouter();
  const params = useParams();

  const storyId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadCover(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeName =
        `season-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("covers")
        .upload(safeName, file);

      if (error) {
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("covers")
        .getPublicUrl(safeName);

      setCoverImage(data.publicUrl);

      alert("Season cover uploaded!");
    } catch (error) {
      console.error(error);
      alert("Failed to upload season cover.");
    } finally {
      setUploading(false);
    }
  }

  async function removeCover() {
    if (!coverImage) return;

    const fileName = coverImage
      .split("/")
      .pop()
      ?.split("?")[0];

    if (fileName) {
      const { error } = await supabase.storage
        .from("covers")
        .remove([fileName]);

      if (error) {
        console.error(error);
      }
    }

    setCoverImage("");
  }

  async function saveSeason() {
    if (!seasonNumber.trim()) {
      alert("Please enter a season number.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a season title.");
      return;
    }

    const number = Number(seasonNumber);

    if (!Number.isFinite(number) || number <= 0) {
      alert("Please enter a valid season number.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("seasons")
        .insert({
          story_id: storyId,
          season_number: number,
          title,
          description,
          cover_image: coverImage || null,
        });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      alert("Season created!");

      router.push(`/creator/stories/${storyId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">

        <Navbar />

        <section className="max-w-3xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          <Link
            href={`/creator/stories/${storyId}`}
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            ← Back to Story
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
            Add Season
          </h1>

          <p className="text-gray-400 mt-3">
            Create a new season for this story.
          </p>

          <div className="space-y-6 mt-10">

            {/* SEASON INFORMATION */}

            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                📕 Season Information
              </h2>

              <div className="space-y-4">

                <input
                  type="number"
                  min="1"
                  placeholder="Season Number"
                  value={seasonNumber}
                  onChange={(e) =>
                    setSeasonNumber(e.target.value)
                  }
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

                <input
                  type="text"
                  placeholder="Season Title"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

                <textarea
                  placeholder="Season Description"
                  rows={5}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

              </div>

            </div>

            {/* COVER */}

            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                🖼 Season Cover
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

              {uploading && (
                <p className="mt-4 text-yellow-400">
                  ⏳ Uploading cover...
                </p>
              )}

              {coverImage && (
                <div className="mt-6">

                  <img
                    src={coverImage}
                    alt="Season Cover Preview"
                    className="w-full max-w-md rounded-xl border border-yellow-500"
                  />

                  <button
                    type="button"
                    onClick={removeCover}
                    className="mt-4 text-red-400 hover:text-red-300 transition"
                  >
                    🗑 Remove Cover
                  </button>

                </div>
              )}

            </div>

            {/* CHECKLIST */}

            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                ✅ Season Checklist
              </h2>

              <div className="space-y-3">

                <p>
                  {seasonNumber.trim()
                    ? "✅"
                    : "❌"}{" "}
                  Season number
                </p>

                <p>
                  {title.trim()
                    ? "✅"
                    : "❌"}{" "}
                  Season title
                </p>

                <p>
                  {description.trim()
                    ? "✅"
                    : "⚪"}{" "}
                  Description
                </p>

                <p>
                  {coverImage
                    ? "✅"
                    : "⚪"}{" "}
                  Cover image
                </p>

              </div>

            </div>

            {/* SAVE */}

            <button
              type="button"
              onClick={saveSeason}
              disabled={
                !seasonNumber.trim() ||
                !title.trim() ||
                uploading ||
                saving
              }
              className="w-full py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "⏳ Creating Season..."
                : "💾 Create Season"}
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