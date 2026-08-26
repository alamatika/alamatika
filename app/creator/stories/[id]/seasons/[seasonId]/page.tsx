
import Link from "next/link";
import Navbar from "../../../../../../components/navbar";
import CreatorGuard from "../../../../../../components/CreatorGuard";
import { supabase } from "../../../../../../lib/supabaseClient";

type Props = {
  params: Promise<{
    id: string;
    seasonId: string;
  }>;
};

export default async function SeasonPage({ params }: Props) {
  const { id, seasonId } = await params;

  // Get the story
  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  // Get the season
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", seasonId)
    .eq("story_id", id)
    .single();

  if (!story || !season || seasonError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-32 px-6">

          <Link
            href={`/creator/stories/${id}`}
            className="text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Story
          </Link>

          <h1 className="text-3xl font-bold text-red-400 mt-8">
            Season not found.
          </h1>

        </section>
      </main>
    );
  }

  // Get chapters belonging to this season
  const { data: chapters, error: chaptersError } =
  await supabase
    .from("chapters")
    .select(
      "id, chapter, title, published, locked"
    )
    .eq("season_id", season.id)
    .order("chapter", {
      ascending: true,
    });

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">

        <Navbar />

        <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          {/* BACK LINKS */}

          <div className="flex flex-wrap gap-4 mb-8">

            <Link
              href={`/creator/stories/${story.id}`}
              className="text-yellow-400 hover:text-yellow-300 transition"
            >
              ← {story.title}
            </Link>

          </div>

          {/* SEASON HEADER */}

<div className="bg-zinc-900 rounded-2xl border border-yellow-500/30 p-4 sm:p-5">

  <div className="flex items-center gap-4">

    {season.cover_image ? (
      <img
        src={season.cover_image}
        alt={season.title}
        className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-xl shrink-0"
      />
    ) : (
      <div className="w-20 h-28 sm:w-24 sm:h-32 bg-zinc-800 rounded-xl flex items-center justify-center text-gray-500 text-xs text-center shrink-0">
        No Cover
      </div>
    )}

    <div className="min-w-0 flex-1">

      <p className="text-yellow-400 text-sm font-semibold">
        {story.title}
      </p>

      <h1 className="text-2xl sm:text-3xl font-bold mt-1 truncate">
        {season.title}
      </h1>

      <p className="text-gray-500 text-sm mt-1">
        Season {season.season_number}
      </p>

      <p className="text-gray-400 text-sm mt-2 line-clamp-2">
        {season.description || "No description yet."}
      </p>

      <Link
        href={`/creator/stories/${story.id}/seasons/${season.id}/edit`}
        className="inline-flex mt-3 px-3 py-2 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition text-sm font-semibold"
      >
        ✏ Edit Season
      </Link>

    </div>

  </div>

</div>

          {/* CHAPTER SECTION */}

          <div className="mt-12">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

              <div>

                <h2 className="text-3xl font-bold text-yellow-400">
                  📖 Chapters
                </h2>

                <p className="text-gray-400 mt-2">
                  Chapters belonging to {season.title}.
                </p>

              </div>

              <Link
                href={`/creator/chapters/new?story=${story.id}&season=${season.id}`}
                className="inline-flex justify-center px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
              >
                + New Chapter
              </Link>

            </div>

            {chaptersError && (
              <div className="bg-red-900/40 border border-red-500 rounded-xl p-5">
                <p className="text-red-300">
                  Error loading chapters.
                </p>
              </div>
            )}

            {!chapters ||
            chapters.length === 0 ? (

              <div className="bg-zinc-900 rounded-2xl p-10 text-center border border-zinc-800">

                <p className="text-gray-400">
                  No chapters in this season yet.
                </p>

                <Link
                  href={`/creator/chapters/new?story=${story.id}&season=${season.id}`}
                  className="inline-block mt-5 px-5 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
                >
                  + Create First Chapter
                </Link>

              </div>

            ) : (

              <div className="space-y-4">

                {chapters.map((chapter) => (

                  <div
                    key={chapter.id}
                    className="bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
                  >

                    <div>

                      <h3 className="text-2xl font-bold">
                        Chapter {chapter.chapter}
                      </h3>

                      <p className="text-gray-400 mt-1">
                        {chapter.title}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            chapter.published
                              ? "bg-green-600"
                              : "bg-yellow-600"
                          }`}
                        >
                          {chapter.published
                            ? "Published"
                            : "Draft"}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            chapter.locked
                              ? "bg-red-600"
                              : "bg-green-700"
                          }`}
                        >
                          {chapter.locked
                            ? "🔒 Premium"
                            : "🆓 Free"}
                        </span>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-3">

                      <Link
                        href={`/creator/chapters/${chapter.id}`}
                        className="px-4 py-3 rounded-lg border border-yellow-500 hover:bg-yellow-500 hover:text-black transition"
                      >
                        ✏ Edit
                      </Link>

                      <Link
                        href={`/read/story/${story.id}/season/${season.id}/chapter-${chapter.chapter}`}
                        className="px-4 py-3 rounded-lg border border-blue-500 hover:bg-blue-500 transition"
                      >
                        👁 View
                      </Link>

                    </div>

                  </div>

                ))}

              </div>

            )}

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