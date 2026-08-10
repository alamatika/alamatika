
import { createSupabaseServerClient } from "../../lib/supabaseServer";
import ChapterCard from "../../components/ChapterCard";
import Navbar from "../../components/navbar";

type ChapterCardProps = {
  chapter: string;
  image: string;
  link: string;
  badge?: string;
  locked?: boolean;
  purchased?: boolean;

  chapterId: number;
  bookmarked: boolean;
};



export default async function Read() {

  const supabase = await createSupabaseServerClient();
  const { data: appearanceRows } = await supabase
  .from("appearance")
  .select("*");

  const appearance: Record<string, string> = {};

appearanceRows?.forEach((item) => {
  appearance[item.key] = item.value;
});

console.log(appearance);
console.log("READ BG:", appearance.read_background);


const {
  data: { user },
} = await supabase.auth.getUser();

const { data: chapters, error } = await supabase
  .from("chapters")
  .select("*")
  .eq("published", true)
  .order("chapter");

  console.log(chapters);
console.log(error);

if (error) {
  return <div>Error loading chapters.</div>;
}
 
let unlockedChapterIds: number[] = [];

if (user) {
  const { data: unlocks } = await supabase
    .from("chapter_unlocks")
    .select("chapter_id")
    .eq("user_id", user.id);

  unlockedChapterIds =
    unlocks?.map((u) => u.chapter_id) ?? [];

  console.log("UNLOCK IDS:", unlockedChapterIds);
}
let bookmarkedChapterIds: number[] = [];

if (user) {
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("chapter_id")
    .eq("user_id", user.id);

  bookmarkedChapterIds =
    bookmarks?.map((b) => b.chapter_id) ?? [];
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

        <h1 className="text-3xl md:text-4xl font-bold text-center text-yellow-400 mb-10">
           ALAMATIKA
        </h1>


  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">

  {chapters?.map((chapter) => {
  console.log(
    "CHAPTER:",
    chapter.chapter,
    "DB ID:",
    chapter.id,
    "Unlocked:",
    unlockedChapterIds.includes(chapter.id)
  );

  return (
    <ChapterCard
  key={chapter.id}
  chapter={chapter.title}
  image={chapter.cover_image}
  link={`/read/chapter-${chapter.chapter}`}
  badge={
    unlockedChapterIds.includes(chapter.id)
      ? "✓ Unlocked"
      : chapter.locked
      ? "LOCKED"
      : "FREE"
  }
  locked={
  chapter.locked &&
  !unlockedChapterIds.includes(chapter.id)
}
purchased={unlockedChapterIds.includes(chapter.id)}
  chapterId={chapter.id}
  bookmarked={bookmarkedChapterIds.includes(chapter.id)}
/>
  );
})}

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