import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";

export default async function Chapters() {
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select(`
      id,
      chapter,
      title,
      locked,
      published,
      season_id,
      seasons (
        id,
        season_number,
        title,
        story_id,
        stories (
          id,
          title
        )
      )
    `);

  if (error) {
    console.error("Error loading chapters:", error);

    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="pt-32 text-center">
          <p className="text-red-400">
            Error loading chapters.
          </p>
        </div>
      </main>
    );
  }

  type StoryInfo = {
  id: number;
  title: string;
};

type SeasonInfo = {
  id: number;
  season_number: number;
  title: string;
  story_id: number;
  stories: StoryInfo | null;
};

type ChapterWithHierarchy = {
  id: number;
  chapter: number;
  title: string;
  locked: boolean;
  published: boolean;
  season_id: number | null;
  seasons: SeasonInfo | null;
};

const chapterRows =
  (chapters ?? []) as unknown as ChapterWithHierarchy[];

  const sortedChapters = [...chapterRows].sort(
    (a, b) => {
      const storyA =
        a.seasons?.stories?.title ?? "";

      const storyB =
        b.seasons?.stories?.title ?? "";

      if (storyA !== storyB) {
        return storyA.localeCompare(storyB);
      }

      const seasonA =
        a.seasons?.season_number ?? 0;

      const seasonB =
        b.seasons?.season_number ?? 0;

      if (seasonA !== seasonB) {
        return seasonA - seasonB;
      }

      return a.chapter - b.chapter;
    }
  );

  const totalChapters = chapterRows.length;

const freeChapters =
  chapterRows.filter(
    (chapter) => !chapter.locked
  ).length;

const premiumChapters =
  chapterRows.filter(
    (chapter) => chapter.locked
  ).length;

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

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mt-6">
            All Chapters
          </h1>

          <p className="text-gray-400 mt-3">
            View chapters across all stories and seasons.
          </p>

          {/* STATISTICS */}

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 md:mt-10">

            <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">

              <h2 className="text-yellow-400 text-xs sm:text-lg font-semibold">
                Total
              </h2>

              <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-3">
                {totalChapters}
              </p>

            </div>

            <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">

              <h2 className="text-green-400 text-xs sm:text-lg font-semibold">
                Free
              </h2>

              <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-3">
                {freeChapters}
              </p>

            </div>

            <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">

              <h2 className="text-red-400 text-xs sm:text-lg font-semibold">
                Premium
              </h2>

              <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-3">
                {premiumChapters}
              </p>

            </div>

          </div>

          {/* STORY SYSTEM */}

          <Link
            href="/creator/stories"
            className="inline-flex mt-10 px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            📚 Manage Stories
          </Link>

          {/* CHAPTER LIST */}

          <div className="mt-10 space-y-5">

            {sortedChapters.length === 0 ? (

              <div className="bg-zinc-900 rounded-2xl p-10 text-center">

                <p className="text-gray-400">
                  No chapters yet.
                </p>

                <Link
                  href="/creator/stories"
                  className="inline-block mt-5 px-5 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
                >
                  📚 Go to Stories
                </Link>

              </div>

            ) : (

              sortedChapters.map((chapter) => {

                const storyTitle =
                  chapter.seasons?.stories?.title ??
                  "Unassigned Story";

                const season =
                  chapter.seasons;

                return (
                  <div
                    key={chapter.id}
                    className="bg-zinc-900 rounded-2xl p-5 sm:p-6"
                  >

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">

                      <div>

                        {/* STORY */}

                        <p className="text-yellow-400 font-semibold text-sm">
                          📚 {storyTitle}
                        </p>

                        {/* SEASON */}

                        {season ? (
                          <p className="text-gray-500 text-sm mt-1">
                            📕 Season{" "}
                            {season.season_number}
                            {" — "}
                            {season.title}
                          </p>
                        ) : (
                          <p className="text-red-400 text-sm mt-1">
                            ⚠ No Season Assigned
                          </p>
                        )}

                        {/* CHAPTER */}

                        <h2 className="text-2xl font-bold mt-3">
                          Chapter {chapter.chapter}
                        </h2>

                        <p className="text-gray-400 mt-1">
                          {chapter.title}
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                          ID: {String(chapter.id)}
                        </p>

                        <p className="text-sm mt-2">
                          {chapter.locked
                            ? "🔒 Premium"
                            : "🆓 Free"}{" "}
                          •{" "}
                          {chapter.published
                            ? "✅ Published"
                            : "📝 Draft"}
                        </p>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center gap-3">

                        <Link
                          href={`/creator/chapters/${chapter.id}`}
                          className="px-4 py-3 rounded-lg border border-yellow-500 hover:bg-yellow-500 hover:text-black transition"
                        >
                          ✏ Edit
                        </Link>

                        <Link
                          href={
                            chapter.seasons
                             ? `/read/story/${chapter.seasons.story_id}/season/${chapter.seasons.id}/chapter-${chapter.chapter}`
                             : `/read/chapter-${chapter.chapter}`
                             }
                          className="px-4 py-3 rounded-lg border border-blue-500 hover:bg-blue-500 transition"
                        >
                          👁 View
                        </Link>

                        {season && (
                          <Link
                            href={`/creator/stories/${season.story_id}/seasons/${season.id}`}
                            className="px-4 py-3 rounded-lg border border-purple-500 hover:bg-purple-500 transition"
                          >
                            📕 Season
                          </Link>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })

            )}

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