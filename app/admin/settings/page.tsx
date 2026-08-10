import Navbar from "../../../components/navbar";
import Link from "next/link";

export default function Settings() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-5xl mx-auto pt-32 px-6">

        <Link
  href="/admin"
  className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
>
  🏠 Creator Studio
</Link>

        
        <h1 className="text-5xl font-bold text-yellow-400">
          Settings
        </h1>

        <p className="text-gray-400 mt-3">
          Configure your ALAMATIKA website.
        </p>

        <div className="space-y-8 mt-12">

          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400">
              🌐 Website
            </h2>

            <input
              type="text"
              placeholder="Website Title"
              className="w-full mt-6 bg-black rounded-xl p-4 border border-yellow-500/30"
            />

            <textarea
              placeholder="Official Notice"
              rows={4}
              className="w-full mt-4 bg-black rounded-xl p-4 border border-yellow-500/30"
            />
          </div>

          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400">
              📚 Reading
            </h2>

            <input
              type="number"
              placeholder="Number of Free Chapters"
              className="w-full mt-6 bg-black rounded-xl p-4 border border-yellow-500/30"
            />
          </div>

          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400">
              🌍 Social Links
            </h2>

            <input
              type="text"
              placeholder="Facebook"
              className="w-full mt-6 bg-black rounded-xl p-4 border border-yellow-500/30"
            />

            <input
              type="text"
              placeholder="Instagram"
              className="w-full mt-4 bg-black rounded-xl p-4 border border-yellow-500/30"
            />

            <input
              type="text"
              placeholder="Discord"
              className="w-full mt-4 bg-black rounded-xl p-4 border border-yellow-500/30"
            />
          </div>

          <button className="w-full py-4 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition">
            💾 Save Settings
          </button>

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
