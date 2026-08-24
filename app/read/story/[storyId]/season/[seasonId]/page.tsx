
import { createSupabaseServerClient } from "../../../../../../lib/supabaseServer";
import ChapterCard from "../../../../../../components/ChapterCard";
import Navbar from "../../../../../../components/navbar";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    storyId: string;
    seasonId: string;
  }>;
};

export default async function SeasonReaderPage({
  params,
}: Props) {
  const { storyId, seasonId } = await params;

  const supabase = await createSupabaseServerClient();

  // Appearance
  const { data: appearanceRows } = await supabase
    .from("appearance")
    .select("*");

  const appearance: Record<string, string> = {};

  appearanceRows?.forEach((item) => {
    appearance[item.key] = item.value;
  });

  // Story
  const { data: story, error: storyError } =
    await supabase
      .from("stories")
      .select("id, title")
      .eq("id", storyId)
      .eq("published", true)
      .single();

  if (storyError || !story) {
    notFound();
  }

  // Season
  const { data: season, error: seasonError } =
    await supabase
      .from("seasons")
      .select("*")
      .eq("id", seasonId)
      .eq("story_id", story.id)
      .single();

  if (seasonError || !season) {
    notFound();
  }

  // Chapters in this season
  const { data: chapters, error: chaptersError } =
    await supabase
      .from("chapters")
      .select("*")
      .eq("season_id", season.id)
      .eq("published", true)
      .order("chapter", {
        ascending: true,
      });

  if (chaptersError) {
    console.error(
      "Error loading season chapters:",
      chaptersError
    );
  }

  // Current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unlocked chapters
  let unlockedChapterIds: number[] = [];

  if (user) {
    const { data: unlocks } = await supabase
      .from("chapter_unlocks")
      .select("chapter_id")
      .eq("user_id", user.id);

    unlockedChapterIds =
      unlocks?.map((item) => item.chapter_id) ?? [];
  }

  // Bookmarks
  let bookmarkedChapterIds: number[] = [];

  if (user) {
    const { data: bookmarks } = await supabase
      .from("bookmarks")
      .select("chapter_id")
      .eq("user_id", user.id);

    bookmarkedChapterIds =
      bookmarks?.map((item) => item.chapter_id) ?? [];
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
          href={`/read/story/${story.id}`}
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
        >
          ← Back to {story.title}
        </Link>

        {/* HEADER */}

        <div className="mb-8">

  <p className="text-yellow-400 text-sm font-semibold">
    {story.title}
  </p>

  <h1 className="text-2xl sm:text-3xl font-bold mt-1">
    {season.title}
  </h1>

  <p className="text-gray-500 text-sm mt-1">
    Season {season.season_number}
  </p>

</div>

        {/* CHAPTERS */}

        {!chapters || chapters.length === 0 ? (

          <div className="bg-zinc-900/90 rounded-2xl p-10 text-center border border-zinc-800">

            <p className="text-gray-500">
              No chapters are available in this season yet.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-5 justify-items-center">

            {chapters.map((chapter) => {

              const unlocked =
                unlockedChapterIds.includes(
                  chapter.id
                );

              const bookmarked =
                bookmarkedChapterIds.includes(
                  chapter.id
                );

              return (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter.title}
                  image={chapter.cover_image}
                  link={`/read/story/${story.id}/season/${season.id}/chapter-${chapter.chapter}`}
                  badge={
                    unlocked
                      ? "✓ Unlocked"
                      : chapter.locked
                      ? "LOCKED"
                      : "FREE"
                  }
                  locked={
                    chapter.locked &&
                    !unlocked
                  }
                  purchased={unlocked}
                  chapterId={chapter.id}
                  bookmarked={bookmarked}
                />
              );
            })}

          </div>

        )}

      </section>

      <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

    </main>
  );
}