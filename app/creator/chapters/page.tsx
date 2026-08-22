import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";

export default async function Chapters() {
  const { data: chapters, error } = await supabase
  .from("chapters")
  .select("*")
  .order("chapter");

if (error) {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-32 text-center">
        Error loading chapters.
      </div>
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


        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mt-6">
          Chapters
        </h1>

        <p className="text-gray-400 mt-3">
          Build the story of ALAMATIKA.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 md:mt-10">

  <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
    <h2 className="text-yellow-400 text-xs sm:text-lg font-semibold">
      Total
    </h2>

    <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-3">
      {chapters.length}
    </p>
  </div>

  <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
    <h2 className="text-green-400 text-xs sm:text-lg font-semibold">
      Free
    </h2>

    <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-3">
      {chapters.filter(c => !c.locked).length}
    </p>
  </div>

  <div className="bg-zinc-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
    <h2 className="text-red-400 text-xs sm:text-lg font-semibold">
      Premium
    </h2>

    <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-3">
      {chapters.filter(c => c.locked).length}
    </p>
  </div>

</div>


        <Link href="/creator/chapters/new">
  <button className="mt-10 w-full sm:w-auto px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition">
    + New Chapter
  </button>
</Link>

        <div className="mt-10 space-y-5">

  {chapters.map((chapter) => (

    <div
  key={chapter.id}
  className="bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-5"
>

      <div>

        <h2 className="text-2xl font-bold">
          Chapter {chapter.chapter}
        </h2>

        <div className="mt-1 text-gray-400">
  <p>{chapter.title}</p>

  <p className="text-sm mt-1">
    {chapter.locked ? "🔒 Premium" : "🆓 Free"} •{" "}
    {chapter.published ? "✅ Published" : "📝 Draft"}
  </p>
</div>

      </div>

      <div className="flex flex-wrap items-center gap-3">

  <p className="text-sm text-gray-400">
    ID: {String(chapter.id)}
  </p>

  <p className="text-sm text-gray-400">
    Chapter: {chapter.chapter}
  </p>

  <Link href={`/creator/chapters/${chapter.id}`}>
    <button className="px-4 py-3 rounded-lg border border-yellow-500 hover:bg-yellow-500 hover:text-black transition">
      ✏ Edit
    </button>
  </Link>

  <Link href={`/read/chapter-${chapter.chapter}`}>
    <button className="px-4 py-3 rounded-lg border border-blue-500 hover:bg-blue-500 transition">
      👁 View
    </button>
  </Link>

</div>

    </div>

  ))}

</div>


      <footer className="mt-24 mb-10 text-black-600 text-sm text-center hover:text-black transition">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>
      
      </section>
    </main>
    </CreatorGuard>
  );
}
