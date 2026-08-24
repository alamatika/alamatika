"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../../../../components/navbar";
import CreatorGuard from "../../../../../../../components/CreatorGuard";
import imageCompression from "browser-image-compression";
import { supabase } from "../../../../../../../lib/supabaseClient";

export default function EditSeason() {
  const params = useParams();
  const router = useRouter();

  const storyId = params.id as string;
  const seasonId = params.seasonId as string;

  const [storyTitle, setStoryTitle] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSeason() {
      const [
        { data: story, error: storyError },
        { data: season, error: seasonError },
      ] = await Promise.all([
        supabase
          .from("stories")
          .select("id, title")
          .eq("id", storyId)
          .single(),

        supabase
          .from("seasons")
          .select("*")
          .eq("id", seasonId)
          .eq("story_id", storyId)
          .single(),
      ]);

      if (storyError || !story) {
        alert("Story not found.");
        router.push("/creator/stories");
        return;
      }

      if (seasonError || !season) {
        alert("Season not found.");
        router.push(`/creator/stories/${storyId}`);
        return;
      }

      setStoryTitle(story.title ?? "");
      setSeasonNumber(
        String(season.season_number ?? "")
      );
      setTitle(season.title ?? "");
      setDescription(season.description ?? "");
      setCoverImage(season.cover_image ?? "");

      setLoading(false);
    }

    if (storyId && seasonId) {
      loadSeason();
    }
  }, [storyId, seasonId, router]);

  function getStorageFileName(url: string) {
    if (!url) return null;

    return (
      url
        .split("/")
        .pop()
        ?.split("?")[0] ?? null
    );
  }

  async function uploadNewCover(
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
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const safeName =
        `season-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("covers")
          .upload(safeName, compressed);

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("covers")
        .getPublicUrl(safeName);

      const newUrl = data.publicUrl;

      // Update the database first.
      const { error: updateError } =
        await supabase
          .from("seasons")
          .update({
            cover_image: newUrl,
          })
          .eq("id", seasonId)
          .eq("story_id", storyId);

      if (updateError) {
        console.error(updateError);

        await supabase.storage
          .from("covers")
          .remove([safeName]);

        alert(updateError.message);
        return;
      }

      const oldFileName =
        getStorageFileName(coverImage);

      setCoverImage(newUrl);

      // Remove old cover only after the database
      // successfully points to the new one.
      if (
        oldFileName &&
        oldFileName !== safeName
      ) {
        const { error: removeError } =
          await supabase.storage
            .from("covers")
            .remove([oldFileName]);

        if (removeError) {
          console.error(
            "Old season cover could not be removed:",
            removeError
          );
        }
      }

      alert("Season cover changed!");
    } catch (error) {
      console.error(error);
      alert("Failed to change season cover.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  }

  async function removeCover() {
    if (!coverImage) return;

    const fileName =
      getStorageFileName(coverImage);

    const { error: updateError } =
      await supabase
        .from("seasons")
        .update({
          cover_image: null,
        })
        .eq("id", seasonId)
        .eq("story_id", storyId);

    if (updateError) {
      console.error(updateError);
      alert(updateError.message);
      return;
    }

    if (fileName) {
      const { error: removeError } =
        await supabase.storage
          .from("covers")
          .remove([fileName]);

      if (removeError) {
        console.error(
          "Season cover could not be removed:",
          removeError
        );
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
        .update({
          season_number: number,
          title: title.trim(),
          description:
            description.trim() || null,
        })
        .eq("id", seasonId)
        .eq("story_id", storyId);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      alert("Season updated!");

      router.push(
        `/creator/stories/${storyId}/seasons/${seasonId}`
      );

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-3xl mx-auto pt-32 px-6">
          <p className="text-gray-400">
            Loading season...
          </p>
        </section>
      </main>
    );
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">

        <Navbar />

        <section className="max-w-3xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          <Link
            href={`/creator/stories/${storyId}/seasons/${seasonId}`}
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            ← Back to Season
          </Link>

          <p className="text-gray-500 text-sm">
            {storyTitle}
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400 mt-1">
            Edit Season
          </h1>

          <p className="text-gray-400 mt-3">
            Update this season information and cover.
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
                  value={seasonNumber}
                  onChange={(e) =>
                    setSeasonNumber(e.target.value)
                  }
                  placeholder="Season Number"
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Season Title"
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Season Description"
                  rows={6}
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

              </div>

            </div>

            {/* COVER */}

            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                🖼 Season Cover
              </h2>

              {coverImage ? (
                <div>

                  <img
                    src={coverImage}
                    alt="Season Cover"
                    className="w-28 sm:w-36 aspect-[3/4] object-cover rounded-xl border border-yellow-500"
                  />

                  <div className="flex flex-wrap gap-3 mt-4">

                    <label className="cursor-pointer bg-yellow-500 text-black font-bold px-5 py-3 rounded-xl hover:bg-yellow-400 transition">

                      🔄 Change Cover

                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadNewCover}
                        className="hidden"
                      />

                    </label>

                    <button
                      type="button"
                      onClick={removeCover}
                      className="px-5 py-3 rounded-xl border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition"
                    >
                      🗑 Remove Cover
                    </button>

                  </div>

                </div>
              ) : (

                <label className="inline-block cursor-pointer bg-yellow-500 text-black font-bold px-5 py-3 rounded-xl hover:bg-yellow-400 transition">

                  📤 Upload Cover

                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadNewCover}
                    className="hidden"
                  />

                </label>

              )}

              {uploadingCover && (
                <p className="mt-4 text-yellow-400">
                  ⏳ Updating cover...
                </p>
              )}

            </div>

            {/* SAVE */}

            <button
              type="button"
              onClick={saveSeason}
              disabled={
                !seasonNumber.trim() ||
                !title.trim() ||
                saving ||
                uploadingCover
              }
              className="w-full py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "⏳ Saving..."
                : "💾 Save Season"}
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