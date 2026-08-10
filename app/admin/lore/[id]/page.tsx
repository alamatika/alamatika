"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import AdminGuard from "../../../../components/AdminGuard";
import Navbar from "../../../../components/navbar";

function getStoragePath(publicUrl: string) {
  if (!publicUrl) return null;

  const marker = "/storage/v1/object/public/lore/";

  const index = publicUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    publicUrl.substring(index + marker.length)
  );
}

export default function EditLorePage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const [originalImage, setOriginalImage] = useState("");

  async function saveLore() {
    const oldImage = originalImage;

    const { error } = await supabase
      .from("lore")
      .update({
        title,
        category,
        image,
        description,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    // Delete old image only if it was replaced or removed.
    if (oldImage && oldImage !== image) {
      const oldPath = getStoragePath(oldImage);

      if (oldPath) {
        const { error: deleteError } = await supabase.storage
          .from("lore")
          .remove([oldPath]);

        if (deleteError) {
          console.error(
            "Could not delete old lore image:",
            deleteError
          );
        }
      }
    }

    alert("Lore updated!");

    window.location.href = "/admin/lore";
  }

  async function deleteLore() {
    const confirmed = confirm(
      "Are you sure you want to delete this lore?"
    );

    if (!confirmed) return;

    // Delete database record first.
    const { error } = await supabase
      .from("lore")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    // Delete associated image from storage.
    if (image) {
      const imagePath = getStoragePath(image);

      if (imagePath) {
        const { error: storageError } =
          await supabase.storage
            .from("lore")
            .remove([imagePath]);

        if (storageError) {
          console.error(
            "Could not delete lore image:",
            storageError
          );
        }
      }
    }

    alert("Lore deleted!");

    window.location.href = "/admin/lore";
  }

  useEffect(() => {
    async function loadLore() {
      if (!id) return;

      const { data, error } = await supabase
        .from("lore")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(error);
        setLoading(false);
        return;
      }

      setTitle(data.title ?? "");
      setCategory(data.category ?? "");
      setDescription(data.description ?? "");
      setImage(data.image ?? "");
      setOriginalImage(data.image ?? "");

      setLoading(false);
    }

    loadLore();
  }, [id]);

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
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
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading lore...
      </main>
    );
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
            Edit Lore
          </h1>

          <div className="space-y-6">

            {/* LORE IMAGE */}

            <div className="space-y-5">

              <h2 className="text-2xl font-bold text-yellow-400">
                Lore Image
              </h2>

              <label className="cursor-pointer block w-fit">

                <div className="w-64 h-80 rounded-2xl border-2 border-dashed border-yellow-500 hover:bg-zinc-900 transition flex items-center justify-center overflow-hidden">

                  {image ? (
                    <img
                      src={image}
                      alt="Lore"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400 p-4">

                      <p className="text-6xl mb-4">
                        🖼️
                      </p>

                      <p className="font-semibold">
                        Click to Upload Image
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
                  onChange={handleImageUpload}
                />

              </label>

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
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-yellow-500 transition"
            />

            {/* ACTIONS */}

            <div className="flex flex-col sm:flex-row gap-4">

              <button
                onClick={saveLore}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold transition"
              >
                💾 Update Lore
              </button>

              <button
                onClick={deleteLore}
                className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-bold transition"
              >
                🗑 Delete Lore
              </button>

            </div>

          </div>

        </section>
      </main>
    </AdminGuard>
  );
}