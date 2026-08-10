import Navbar from "@/components/navbar";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";

export default async function AboutSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data } = await supabase
    .from("site_content")
    .select("*")
    .eq("key", slug)
    .single();

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-5xl mx-auto pt-24 md:pt-32">
        <h1 className="text-3xl md:text-5xl font-bold text-yellow-400 mb-6 md:mb-8">
          {data.title}
        </h1>

        <div className="whitespace-pre-wrap leading-7 md:leading-8 text-gray-300 text-sm md:text-base">
          {data.content}
        </div>
      </section>
    </main>
  );
}