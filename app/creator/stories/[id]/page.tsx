import Link from "next/link";
import Navbar from "../../../../components/navbar";
import CreatorGuard from "../../../../components/CreatorGuard";
import { supabase } from "../../../../lib/supabaseClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StoryPage({ params }: Props) {
  const { id } = await params;

  const { data: story, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !story) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-32 px-6">
          <Link
            href="/creator/stories"
            className="text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Stories
          </Link>

          <h1 className="text-3xl font-bold text-red-400 mt-8">
            Story not found.
          </h1>
        </section>
      </main>
    );
  }

  const { data: seasons, error: seasonsError } = await supabase
    .from("seasons")
    .select("*")
    .eq("story_id", story.id)
    .order("season_number");

  let chapterCounts: Record<number, number> = {};

  if (seasons && seasons.length > 0) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id, season_id")
      .in(
        "season_id",
        seasons.map((season) => season.id)
      );

    chapterCounts =
      chapters?.reduce(
        (result, chapter) => {
          if (chapter.season_id) {
            result[chapter.season_id] =
              (result[chapter.season_id] || 0) + 1;
          }

          return result;
        },
        {} as Record<number, number>
      ) ?? {};
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">

        <Navbar />

        <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          <Link
            href="/creator/stories"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            ← Back to Stories
          </Link>

          {/* STORY HEADER */}

          <div className="bg-zinc-900 rounded-2xl border border-yellow-500/30 p-4 sm:p-5">

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

      <div className="flex flex-wrap items-center gap-3">

        <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 truncate">
          {story.title}
        </h1>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
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

      <p className="text-gray-400 text-sm mt-2 line-clamp-2">
        {story.description ||
          "No description yet."}
      </p>

      <Link
        href={`/creator/stories/${story.id}/edit`}
        className="inline-flex mt-3 px-3 py-2 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition text-sm font-semibold"
      >
        ✏ Edit Story
      </Link>

    </div>

  </div>

</div>

          {/* SEASONS */}

          <div className="mt-12">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

              <div>

                <h2 className="text-3xl font-bold text-yellow-400">
                  📕 Seasons
                </h2>

                <p className="text-gray-400 mt-2">
                  Organize this story into seasons.
                </p>

              </div>

              <Link
                href={`/creator/stories/${story.id}/seasons/new`}
                className="inline-flex justify-center px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
              >
                + Add Season
              </Link>

            </div>

            {seasonsError && (
              <p className="text-red-400">
                Error loading seasons.
              </p>
            )}

            {!seasons || seasons.length === 0 ? (

              <div className="bg-zinc-900 rounded-2xl p-10 text-center border border-zinc-800">

                <p className="text-gray-400">
                  No seasons yet.
                </p>

              </div>

            ) : (

              <div className="max-w-3xl space-y-3">

                {seasons.map((season) => (

                  <div
  key={season.id}
  className="flex items-center gap-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-yellow-500 transition p-3 sm:p-4"
>

  {season.cover_image ? (
    <img
      src={season.cover_image}
      alt={season.title}
      className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-lg shrink-0"
    />
  ) : (
    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-zinc-800 rounded-lg flex items-center justify-center text-gray-500 text-xs text-center shrink-0">
      No Cover
    </div>
  )}

  <div className="min-w-0 flex-1">

    <p className="text-yellow-400 text-sm font-semibold">
      Season {season.season_number}
    </p>

    <h3 className="text-lg sm:text-xl font-bold truncate">
      {season.title}
    </h3>

    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
      {season.description ||
        "No description yet."}
    </p>

    <p className="text-xs text-gray-500 mt-2">
      {chapterCounts[season.id] || 0}{" "}
      {chapterCounts[season.id] === 1
        ? "chapter"
        : "chapters"}
    </p>

  </div>

  <div className="flex flex-col gap-2 shrink-0">

    <Link
      href={`/creator/stories/${story.id}/seasons/${season.id}`}
      className="px-3 py-2 rounded-lg border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition text-sm font-semibold"
    >
      📚 Manage
    </Link>

    <Link
      href={`/creator/stories/${story.id}/seasons/${season.id}/edit`}
      className="px-3 py-2 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition text-sm font-semibold"
    >
      ✏ Edit
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