import Navbar from "../../../components/navbar";
import Link from "next/link";

export default function AssetLibrary() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

        <Link
  href="/admin"
  className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
>
  🏠 Creator Studio
</Link>


        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400">
  Asset Library
</h1>

        <p className="text-gray-400 mt-3">
          Organize all assets for ALAMATIKA.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">

          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl font-bold">🖼 Characters</h2>
            <p className="text-gray-400 mt-2">
              Character portraits and artwork.
            </p>
            <Link
               href="/admin/assets/characters"
                className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
                   >
                      Open 
            </Link>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl font-bold">📖 Chapter Covers</h2>
            <p className="text-gray-400 mt-2">
              Covers for every chapter.
            </p>
            <Link href="/admin/assets/chapter-cover"
             className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
            > 
                open
            
            </Link>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl font-bold">📄 Manga Pages</h2>
            <p className="text-gray-400 mt-2">
              Uploaded manga pages.
            </p>
           <Link href="/admin/assets/manga-pages"
             className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
            > 
                open
            
            </Link>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl font-bold">🌄 Backgrounds</h2>
            <p className="text-gray-400 mt-2">
              Scenery and environments.
            </p>
            <Link href="/admin/assets/backgrounds"
             className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
            > 
                open
          
            </Link>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl font-bold">🎨 Logos</h2>
            <p className="text-gray-400 mt-2">
              Website logos and branding.
            </p>
            <Link href="/admin/assets/logos"
            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition"
            > 
                open
          
            </Link>
          </div>

        </div>

      <footer className="mt-24 mb-10 text-black-600 text-sm text-center hover:text-black transition">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

      </section>
    </main>
  );
}