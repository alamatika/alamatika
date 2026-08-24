
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import Navbar from "../../../../components/navbar";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    storyId: string;
  }>;
};

export default async function StoryReaderPage({ params }: Props) {
  const { storyId } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: appearanceRows } = await supabase
    .from("appearance")
    .select("*");

  const appearance: Record<string, string> = {};

  appearanceRows?.forEach((item) => {
    appearance[item.key] = item.value;
  });

  const { data: story, error: storyError } =
    await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .eq("published", true)
      .single();

  if (storyError || !story) {
    notFound();
  }

  const { data: seasons, error: seasonsError } =
    await supabase
      .from("seasons")
      .select("*")
      .eq("story_id", story.id)
      .order("season_number", {
        ascending: true,
      });

  if (seasonsError) {
    console.error(
      "Error loading seasons:",
      seasonsError
    );
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white pt-24 md:pt-32 px-4 md:px-6"
      style={{
        backgroundImage: `url(${
          appearance.read_background ??
          "/backgrounds/read.jpg"
        })`,
      }}
    >
      <Navbar />

      <section className="w-full max-w-6xl mx-auto">

        {/* BACK */}

        <Link
          href="/read"
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
        >
          ← Back to Stories
        </Link>


        {/* SEASONS */}

        <div className="mt-6">

  <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">
    {story.title}
  </h1>

  <p className="text-gray-400 mb-6">
    Choose a season to start reading.
  </p>

  <h2 className="text-xl font-bold text-yellow-400 mb-3">
    📕 Seasons
  </h2>

          <p className="text-gray-400 mb-8">
            Choose a season to view its chapters.
          </p>

          {!seasons || seasons.length === 0 ? (

            <div className="bg-zinc-900/90 rounded-2xl p-10 text-center border border-zinc-800">
              <p className="text-gray-500">
                No seasons available yet.
              </p>
            </div>

          ) : (

            <div className="max-w-3xl mx-auto space-y-3">
  {seasons.map((season) => (
    <Link
      key={season.id}
      href={`/read/story/${story.id}/season/${season.id}`}
      className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 sm:p-4 hover:border-yellow-500 hover:bg-zinc-800 transition"
    >
      {season.cover_image ? (
        <img
          src={season.cover_image}
          alt={season.title}
          className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-16 h-20 sm:w-20 sm:h-24 bg-zinc-800 rounded-lg flex items-center justify-center text-gray-500 text-xs shrink-0">
          No Cover
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-yellow-400 text-sm font-semibold">
          Season {season.season_number}
        </p>

        <h3 className="text-base sm:text-lg font-bold truncate">
          {season.title}
        </h3>

        {season.description && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
            {season.description}
          </p>
        )}
      </div>

      <span className="shrink-0 text-yellow-400 text-sm font-semibold">
        View →
      </span>
    </Link>
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
  );
}