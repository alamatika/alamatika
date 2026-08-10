import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/navbar";

export default async function ContactPage() {
  const { data } = await supabase
    .from("site_content")
    .select("*")
    .eq("slug", "contact")
    .single();

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-5xl mx-auto pt-32 px-6">
        <h1 className="text-5xl font-bold text-yellow-400 mb-8">
          {data?.title}
        </h1>

        <div className="whitespace-pre-wrap leading-8 text-gray-300">
          {data?.content}
        </div>
      </section>
    </main>
  );
}