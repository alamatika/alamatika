import Navbar from "@/components/navbar";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";

export default async function AboutPage() {
  const { data } = await supabase
    .from("site_content")
    .select("*")
    .eq("key", "about")
    .single();

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6">
      <Navbar />

      <section className="max-w-5xl mx-auto pt-24 md:pt-32">

        <h1 className="text-3xl md:text-5xl font-bold text-yellow-400 mb-6 md:mb-8">
          {data.title}
        </h1>

        <div className="whitespace-pre-wrap leading-7 md:leading-8 text-gray-300 text-sm md:text-base">
          {data.content}
        </div>

        <div className="mt-16 border-t border-zinc-700 pt-10">

          <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-6">
            More Information
          </h2>

          <div className="grid gap-4">

            <Link
              href="/about/privacy"
              className="rounded-xl bg-zinc-900 border border-zinc-700 p-5 hover:bg-zinc-800 transition"
            >
              🔒 Privacy Policy
            </Link>

            <Link
              href="/about/terms"
              className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 md:p-5 hover:bg-zinc-800 transition text-sm md:text-base"
            >
              📜 Terms of Service
            </Link>

            <Link
              href="/about/faq"
              className="rounded-xl bg-zinc-900 border border-zinc-700 p-5 hover:bg-zinc-800 transition"
            >
              ❓ FAQ
            </Link>

            <Link
              href="/about/contact"
              className="rounded-xl bg-zinc-900 border border-zinc-700 p-5 hover:bg-zinc-800 transition"
            >
              ✉️ Contact
            </Link>

          </div>

        </div>

      </section>
    </main>
  );
}