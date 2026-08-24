"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../../components/navbar";
import CreatorGuard from "../../../../../components/CreatorGuard";
import imageCompression from "browser-image-compression";
import { supabase } from "../../../../../lib/supabaseClient";

export default function EditStory() {
  const params = useParams();
  const router = useRouter();

  const storyId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(true);

  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadStory() {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .single();

      if (error || !data) {
        alert("Story not found.");
        router.push("/creator/stories");
        return;
      }

      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setCoverImage(data.cover_image ?? "");
      setPublished(data.published ?? true);
      setLoading(false);
    }

    if (storyId) {
      loadStory();
    }
  }, [storyId, router]);

  function getStorageFileName(url: string) {
    if (!url) return null;

    return url
      .split("/")
      .pop()
      ?.split("?")[0] ?? null;
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
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeName =
        `story-cover-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("covers")
        .upload(safeName, compressed);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("covers")
        .getPublicUrl(safeName);

      const newUrl = data.publicUrl;

      // Update database first.
      const { error: updateError } = await supabase
        .from("stories")
        .update({
          cover_image: newUrl,
        })
        .eq("id", storyId);

      if (updateError) {
        console.error(updateError);

        // New file wasn't used, so clean it up.
        await supabase.storage
          .from("covers")
          .remove([safeName]);

        alert(updateError.message);
        return;
      }

      const oldFileName =
        getStorageFileName(coverImage);

      setCoverImage(newUrl);

      // Only remove the old cover after the DB points
      // to the new one.
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
            "Old story cover could not be removed:",
            removeError
          );
        }
      }

      alert("Story cover changed!");

    } catch (error) {
      console.error(error);
      alert("Failed to change story cover.");
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
        .from("stories")
        .update({
          cover_image: null,
        })
        .eq("id", storyId);

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
          "Cover file could not be removed:",
          removeError
        );
      }
    }

    setCoverImage("");
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
        .update({
          title: title.trim(),
          description:
            description.trim() || null,
          published,
        })
        .eq("id", storyId);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      alert("Story updated!");

      router.push(
        `/creator/stories/${storyId}`
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
            Loading story...
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
            href={`/creator/stories/${storyId}`}
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            ← Back to Story
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
            Edit Story
          </h1>

          <p className="text-gray-400 mt-3">
            Update your story information.
          </p>

          <div className="space-y-6 mt-10">

            {/* STORY INFORMATION */}

            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                📖 Story Information
              </h2>

              <div className="space-y-4">

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Story Title"
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Story Description"
                  rows={6}
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30 outline-none focus:border-yellow-500"
                />

                <select
                  value={
                    published
                      ? "Published"
                      : "Draft"
                  }
                  onChange={(e) =>
                    setPublished(
                      e.target.value ===
                        "Published"
                    )
                  }
                  className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
                >
                  <option value="Published">
                    Published
                  </option>

                  <option value="Draft">
                    Draft
                  </option>
                </select>

              </div>

            </div>

            {/* COVER */}

            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                🖼 Story Cover
              </h2>

              {coverImage ? (
                <div>

                  <img
                    src={coverImage}
                    alt="Story Cover"
                    className="w-32 sm:w-40 aspect-[3/4] object-cover rounded-xl border border-yellow-500"
                  />

                  <div className="flex flex-wrap gap-3 mt-4">

                    <label className="cursor-pointer bg-yellow-500 text-black font-bold px-5 py-3 rounded-xl hover:bg-yellow-400 transition">

                      🔄 Change Cover

                      <input
                        type="file"
                        accept="image/*"
                        onChange={
                          uploadNewCover
                        }
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
                    onChange={
                      uploadNewCover
                    }
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
              onClick={saveStory}
              disabled={
                !title.trim() ||
                saving ||
                uploadingCover
              }
              className="w-full py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "⏳ Saving..."
                : "💾 Save Story"}
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