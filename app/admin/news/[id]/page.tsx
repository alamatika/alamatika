"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import AdminGuard from "../../../../components/AdminGuard";
import Navbar from "../../../../components/navbar";


export default function EditNewsPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");

  async function saveNews() {
    const { error } = await supabase
      .from("news")
      .update({
        title,
        summary,
        image,
        content,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("News updated!");

    window.location.href = "/admin/news";
  }

  async function deleteNews() {

    const confirmed = confirm(
      "Are you sure you want to delete this news?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("News deleted!");

    window.location.href = "/admin/news";
  }

  useEffect(() => {



    async function loadNews() {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(error);
        return;
      }


      setTitle(data.title ?? "");
      setSummary(data.summary ?? "");
      setContent(data.content ?? "");
      setImage(data.image ?? "");

      setLoading(false);
    }

    if (id) {
      loadNews();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading news...
      </main>
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
  🏠 Admin Studio
</Link>

          <h1 className="text-5xl font-bold text-yellow-400 mb-10">
            Edit news
          </h1>

          <div className="space-y-6">

            <div className="space-y-5">

              <h2 className="text-2xl font-bold text-yellow-400">
                News image
              </h2>

              <label className="cursor-pointer">

                <div className="w-64 h-80 rounded-2xl border-2 border-dashed border-yellow-500 hover:bg-zinc-900 transition flex items-center justify-center overflow-hidden">

                  {image ? (

                    <img
                      src={image}
                      alt="News image"
                      className="w-full h-full object-cover"
                    />

                  ) : (

                    <div className="text-center text-gray-400">

                      <p className="text-6xl mb-4">
                        👤
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
                  onChange={async (e) => {

                    const file = e.target.files?.[0];
                    if (!file) return;

                    const filename = `${Date.now()}-${file.name}`;

                    const { error } = await supabase.storage
                      .from("news")
                      .upload(filename, file);

                    if (error) {
                      alert(error.message);
                      return;
                    }

                    const { data } = supabase.storage
                      .from("news")
                      .getPublicUrl(filename);

                    setImage(data.publicUrl);

                  }}
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


            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />


            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Content"
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            />

            <div className="flex gap-4">

              <button
                onClick={saveNews}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold"
              >
                💾 Update News
              </button>

              <button
                onClick={deleteNews}
                className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-bold"
              >
                🗑 Delete News
              </button>

            </div>

          </div>

        </section>
      </main>
    </AdminGuard>
  );
}