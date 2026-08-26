
import { createSupabaseServerClient } from "../../../lib/supabaseServer";
import Navbar from "../../../components/navbar";
import ChapterNavigation from "../../../components/ChapterNavigation";
import ChapterRating from "../../../components/ChapterRating";
import ChapterComments from "../../../components/ChapterComments";
import ChapterImages from "../../../components/ChapterImages";
import ChapterUnlockButton from "../../../components/ChapterUnlockButton";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";



export default async function ChapterPage({

  params,
}: {
  params: Promise<{ chapter: string }>;
}) {

  const supabase = await createSupabaseServerClient();
  const storageAdmin =
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { chapter } = await params;
  const chapterNumber = Number(chapter.replace("chapter-", ""));
   const {
  data: { user },
} = await supabase.auth.getUser();


  const { data: chapterData, error } = await supabase
  .from("chapters")
  .select("*")
  .eq("chapter", chapterNumber)
  .maybeSingle();

if (error || !chapterData) {
  notFound();
}

const { data: chapterSeason, error: seasonError } =
  await supabase
    .from("seasons")
    .select("story_id")
    .eq("id", chapterData.season_id)
    .maybeSingle();

if (seasonError || !chapterSeason) {
  console.error(
    "Chapter season lookup error:",
    seasonError
  );
  notFound();
}

const { data: storyData, error: storyError } =
  await supabase
    .from("stories")
    .select(
      "id, watermark_enabled, watermark_text"
    )
    .eq("id", chapterSeason.story_id)
    .maybeSingle();

if (storyError) {
  console.error(
    "Story watermark settings error:",
    storyError
  );
}

const { count: totalChapters } =
  await supabase
    .from("chapters")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "season_id",
      chapterData.season_id
    )
    .eq("published", true);

let alreadyUnlocked = false;
let credits = 0;

if (user) {
  const { data: unlock } = await supabase
    .from("chapter_unlocks")
    .select("id")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterData.id)
    .maybeSingle();

  alreadyUnlocked = !!unlock;


const { data: profile } = await supabase
  .from("profiles")
  .select("credits")
  .eq("id", user.id)
  .single();

credits = profile?.credits ?? 0;
}



if (chapterData.locked && !alreadyUnlocked) {
  return (
    <main className="min-h-screen bg-black text-white pt-20 md:pt-28">
      <Navbar />

      <div className="max-w-2xl mx-auto text-center px-6 py-20">

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

        {credits >= 25 ? (
  <ChapterUnlockButton
  chapterId={String(chapterData.id)}
  chapterNumber={chapterNumber}
  storyId={String(chapterData.story_id)}
  seasonId={String(chapterData.season_id)}
/>

) : (
  <a
  href={`/wallet?redirect=${encodeURIComponent(
    `/read/story/${chapterSeason.story_id}/season/${chapterData.season_id}/chapter-${chapterNumber}`
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
  const premiumPaths = (
  chapterData.page_images ?? []
).filter(
  (item: unknown): item is string =>
    typeof item === "string" &&
    !item.startsWith("http")
);

  const oldPublicUrls = (
  chapterData.page_images ?? []
).filter(
  (item: unknown): item is string =>
    typeof item === "string" &&
    item.startsWith("http")
);

  let signedUrls: string[] = [];

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

    signedUrls =
      signedPages
        ?.map(
          (item) => item.signedUrl
        )
        .filter(
          (
            url
          ): url is string =>
            !!url
        ) ?? [];
  }

  readerImages = [
    ...oldPublicUrls,
    ...signedUrls,
  ];
}



const readerWatermark =
  chapterData.locked &&
  storyData?.watermark_enabled
    ? (
        storyData.watermark_text?.trim() ||
        "ALAMATIKA • © 2026"
      )
    : undefined;

  return (
    <main className="min-h-screen bg-black text-white pt-28">

      <Navbar />

      <div className="w-full max-w-5xl mx-auto py-8 md:py-12 px-2 md:px-0">

        <h1 className="text-3xl md:text-5xl font-bold text-center text-yellow-400 mb-10">
        {chapterData.title}
        </h1>

        <div id="reader">
  <ChapterImages
    images={readerImages}
    watermark={readerWatermark}
  />
</div>

</div>

<div className="max-w-5xl mx-auto py-8">
</div>

<ChapterNavigation
  current={chapterNumber}
  total={totalChapters ?? 0}
/>
<hr className="max-w-5xl mx-auto my-10 border-zinc-800" />

    <ChapterRating chapter={chapterNumber} />

    <ChapterComments chapter={chapterNumber} />
    
    </main>    
    
  );
}

