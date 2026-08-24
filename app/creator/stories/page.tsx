import Link from "next/link";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";
import { supabase } from "../../../lib/supabaseClient";

export default async function StoriesPage() {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-32 px-6">
          <h1 className="text-4xl font-bold text-yellow-400">
            Stories
          </h1>

          <p className="text-red-400 mt-6">
            Error loading stories.
          </p>
        </section>
      </main>
    );
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          <Link
            href="/creator"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            🏠 Creator Studio
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
                Stories
              </h1>

              <p className="text-gray-400 mt-3">
                Manage all your stories and manga series.
              </p>
            </div>

            <Link
              href="/creator/stories/new"
              className="inline-flex justify-center items-center px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
            >
              + Add Story
            </Link>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">

  {stories?.map((story) => (

    <div
      key={story.id}
      className="bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-yellow-500 transition p-4"
    >

      <div className="flex items-center gap-4">

        {story.cover_image ? (
          <img
            src={story.cover_image}
            alt={story.title}
            className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-xl shrink-0"
          />
        ) : (
          <div className="w-20 h-28 sm:w-24 sm:h-32 bg-zinc-800 rounded-xl flex items-center justify-center text-gray-500 text-xs text-center shrink-0">
            No Cover
          </div>
        )}

        <div className="min-w-0 flex-1">

          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 truncate">
            {story.title}
          </h2>

          <p className="text-gray-400 text-sm mt-2 line-clamp-2">
            {story.description || "No description yet."}
          </p>

          <div className="mt-3">

            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                story.published
                  ? "bg-green-600"
                  : "bg-yellow-600"
              }`}
            >
              {story.published
                ? "Published"
                : "Draft"}
            </span>

          </div>

          <div className="flex flex-wrap gap-2 mt-4">

            <Link
              href={`/creator/stories/${story.id}`}
              className="px-3 py-2 rounded-lg border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition text-sm font-semibold"
            >
              📚 Manage
            </Link>

            <Link
              href={`/creator/stories/${story.id}/edit`}
              className="px-3 py-2 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition text-sm font-semibold"
            >
              ✏ Edit
            </Link>

          </div>

        </div>

      </div>

    </div>

  ))}

</div>

          {(!stories || stories.length === 0) && (
            <div className="bg-zinc-900 rounded-2xl p-10 text-center mt-12">
              <p className="text-gray-400">
                No stories yet.
              </p>
            </div>
          )}

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