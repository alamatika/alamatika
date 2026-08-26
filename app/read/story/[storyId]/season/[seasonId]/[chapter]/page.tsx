
import { createSupabaseServerClient } from "../../../../../../../lib/supabaseServer";
import Navbar from "../../../../../../../components/navbar";
import ChapterNavigation from "../../../../../../../components/ChapterNavigation";
import ChapterRating from "../../../../../../../components/ChapterRating";
import ChapterComments from "../../../../../../../components/ChapterComments";
import ChapterImages from "../../../../../../../components/ChapterImages";
import ChapterUnlockButton from "../../../../../../../components/ChapterUnlockButton";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Props = {
  params: Promise<{
    storyId: string;
    seasonId: string;
    chapter: string;
  }>;
};

export default async function SeasonChapterPage({
  params,
}: Props) {
  const {
    storyId,
    seasonId,
    chapter,
  } = await params;

  const chapterNumber = Number(
    chapter.replace("chapter-", "")
  );

  if (
    !Number.isFinite(chapterNumber) ||
    chapterNumber <= 0
  ) {
    notFound();
  }

  const supabase =
    await createSupabaseServerClient();

  const storageAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

  // Current user
 const {
  data: { user },
} = await supabase.auth.getUser();


  // Story
  const { data: story, error: storyError } =
    await supabase
      .from("stories")
      .select(
  "id, title, watermark_enabled, watermark_text"
)
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
      .select(
        "id, story_id, season_number, title"
      )
      .eq("id", seasonId)
      .eq("story_id", story.id)
      .single();

  if (seasonError || !season) {
    notFound();
  }

  // Chapter
  const {
    data: chapterData,
    error: chapterError,
  } = await supabase
    .from("chapters")
    .select("*")
    .eq("season_id", season.id)
    .eq("chapter", chapterNumber)
    .eq("published", true)
    .maybeSingle();

  if (chapterError) {
    console.error(
      "Chapter loading error:",
      chapterError
    );
  }

  if (chapterError || !chapterData) {
    notFound();
  }

  // Number of chapters in this season
  const { count: totalChapters } =
    await supabase
      .from("chapters")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("season_id", season.id)
      .eq("published", true);

  // Check chapter unlock
  let alreadyUnlocked = false;
  let credits = 0;

  if (user) {
    const { data: unlock } =
      await supabase
        .from("chapter_unlocks")
        .select("id")
        .eq("user_id", user.id)
        .eq("chapter_id", chapterData.id)
        .maybeSingle();

    alreadyUnlocked = !!unlock;


    const { data: profile } =
      await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

    credits = profile?.credits ?? 0;
  }

  // Locked chapter
  if (
    chapterData.locked &&
    !alreadyUnlocked
  ) {
    return (
      <main className="min-h-screen bg-black text-white pt-20 md:pt-28">

        <Navbar />

        <div className="max-w-2xl mx-auto text-center px-6 py-20">

          <p className="text-yellow-400 text-sm font-semibold mb-2">
            {story.title}
          </p>

          <p className="text-gray-500 mb-5">
            Season {season.season_number}
          </p>

          <h1 className="text-5xl font-bold text-yellow-400 mb-4">
            🔒 Locked Chapter
          </h1>

          <h2 className="text-3xl font-bold mb-6">
            {chapterData.title}
          </h2>

          <p className="text-gray-400 mb-10">
            Unlock this chapter to continue reading.
          </p>

          <div className="bg-zinc-900 rounded-2xl border border-yellow-500/30 p-8 mb-10">

            <p className="text-gray-400">
              Chapter Cost
            </p>

            <h3 className="text-5xl font-bold text-yellow-400 mt-2">
              💎 25
            </h3>

            <div className="mt-8">

              <p className="text-gray-400">
                Your Credits
              </p>

              <h3 className="text-4xl font-bold mt-2">
                💎 {credits}
              </h3>

            </div>

          </div>

          {!user ? (
  <a
    href={`/login?redirect=${encodeURIComponent(
      `/read/story/${story.id}/season/${season.id}/chapter-${chapterNumber}`
    )}`}
    className="inline-block px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 transition"
  >
    🔐 Log In to Unlock
  </a>
) : credits >= 25 ? (
  <ChapterUnlockButton
    chapterId={String(
      chapterData.id
    )}
    chapterNumber={chapterNumber}
    storyId={String(story.id)}
    seasonId={String(season.id)}
  />
) : (
  <a
    href={`/wallet?redirect=${encodeURIComponent(
      `/read/story/${story.id}/season/${season.id}/chapter-${chapterNumber}`
    )}`}
    className="inline-block px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 transition"
  >
    💎 Buy Credits
  </a>
)}

        </div>

      </main>
    );
  }

  let readerImages =
  chapterData.page_images ?? [];

if (chapterData.locked) {
  const pageImages =
    chapterData.page_images ?? [];

  const premiumPaths =
    pageImages.filter(
      (item: unknown): item is string =>
        typeof item === "string" &&
        !item.startsWith("http")
    );

  const oldPublicUrls =
    pageImages.filter(
      (item: unknown): item is string =>
        typeof item === "string" &&
        item.startsWith("http")
    );

  let signedByPath = new Map<
    string,
    string
  >();

  if (premiumPaths.length > 0) {
    const {
      data: signedPages,
      error: signedPagesError,
    } = await storageAdmin.storage
      .from("premium-pages")
      .createSignedUrls(
        premiumPaths,
        60 * 10
      );

    if (signedPagesError) {
      console.error(
        "Premium page URL error:",
        signedPagesError
      );

      notFound();
    }

    signedByPath =
      new Map<string, string>();

    for (const item of signedPages ?? []) {
      if (
        item.path &&
        item.signedUrl
      ) {
        signedByPath.set(
          item.path,
          item.signedUrl
        );
      }
    }
  }

  const resolvedImages: (string | null)[] =
  pageImages.map((item: string) => {
    if (item.startsWith("http")) {
      return item;
    }

    return signedByPath.get(item) ?? null;
  });

readerImages =
  resolvedImages.filter(
    (item: string | null) =>
      item !== null
  );
}

const readerWatermark =
  chapterData.locked &&
  story?.watermark_enabled
    ? (
        story.watermark_text?.trim() ||
        "ALAMATIKA • © 2026"
      )
    : undefined;

  // Reader
  return (
    <main className="min-h-screen bg-black text-white pt-28">

      <Navbar />

      <div className="w-full max-w-5xl mx-auto py-8 md:py-12 px-2 md:px-0">

        <div className="text-center mb-8">

          <p className="text-yellow-400 text-sm font-semibold">
            {story.title}
          </p>

          <p className="text-gray-500 mt-1">
            Season {season.season_number}
          </p>

          <h1 className="text-3xl md:text-5xl font-bold text-yellow-400 mt-3">
            {chapterData.title}
          </h1>

        </div>

        <div id="reader">

          <ChapterImages
  images={readerImages}
  watermark={readerWatermark}
/>

        </div>

      </div>

      <ChapterNavigation
  current={chapterNumber}
  total={totalChapters ?? 0}
  storyId={story.id}
  seasonId={season.id}
/>

      <hr className="max-w-5xl mx-auto my-10 border-zinc-800" />

      <ChapterRating
        chapter={chapterNumber}
      />

      <ChapterComments
        chapter={chapterNumber}
      />

    </main>
  );
}