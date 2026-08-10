"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/navbar";
import { supabase } from "../../../lib/supabaseClient";

type Chapter = {
  id: number;
  chapter: number;
  title: string;
  cover_image: string | null;
};

export default function BookmarksPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    async function loadBookmarks() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: bookmarkRows } = await supabase
        .from("chapter_bookmarks")
        .select("chapter_id")
        .eq("user_id", user.id);

      if (!bookmarkRows || bookmarkRows.length === 0) {
        setChapters([]);
        return;
      }

      const ids = bookmarkRows.map((b) => b.chapter_id);

      const { data: chapterData } = await supabase
        .from("chapters")
        .select("id, chapter, title, cover_image")
        .in("id", ids)
        .order("chapter");

      setChapters(chapterData ?? []);
    }

    loadBookmarks();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-6xl mx-auto pt-32 px-6">

        <h1 className="text-5xl font-bold text-yellow-400 mb-3">
          🔖 Bookmarked Chapters
        </h1>

        <p className="text-gray-400 mb-10">
          Your saved Alamatika chapters.
        </p>

        {chapters.length === 0 ? (
          <p className="text-gray-500">
            You have not bookmarked any chapters yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/read/chapter-${chapter.chapter}`}
                className="bg-zinc-900 rounded-2xl overflow-hidden hover:border hover:border-yellow-500 transition"
              >
                {chapter.cover_image ? (
                  <img
                    src={chapter.cover_image}
                    alt={chapter.title}
                    className="w-full object-cover"
                  />
                ) : (
                  <div className="h-80 bg-zinc-800 flex items-center justify-center">
                    No Cover
                  </div>
                )}

                <div className="p-4">
                  <h2 className="text-xl font-bold text-yellow-400">
                    {chapter.title}
                  </h2>

                  <p className="text-gray-400 mt-2">
                    Chapter {chapter.chapter}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}