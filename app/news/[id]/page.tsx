"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import Navbar from "../../../components/navbar";
import Link from "next/link";

type NewsEntry = {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string;
  created_at: string;
};


export default function NewsPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<NewsEntry | null>(null);

  useEffect(() => {
    async function loadNews() {

      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setEntry(data);
      setLoading(false);
    }

    if (id) {
      loadNews();
    }

  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading News...
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        News not found.
      </main>
    );
  }

  return (


    
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-5xl mx-auto pt-24 md:pt-32 px-4 md:px-6">

        <Link
          href="/news"
          className="text-sm md:text-base text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to News
        </Link>

        <div className="mt-10">

          {entry.image && (

            <img
              src={entry.image}
              alt={entry.title}
              className="w-full rounded-3xl border border-yellow-500 max-w-3xl mx-auto"
            />

          )}

          <p className="mt-8 text-yellow-400 font-semibold uppercase tracking-widest text-xs md:text-sm">
            {entry.summary}
          </p>

          <h1 className="text-3xl md:text-5xl font-bold mt-3">
            {entry.title}
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {new Date(entry.created_at).toLocaleDateString()}
            </p>

          <div className="mt-8 md:mt-10 text-base md:text-lg leading-8 md:leading-9 whitespace-pre-wrap text-gray-300">
            {entry.content}
          </div>

        </div>


        <Link
          href="/news"
          className="text-sm md:text-base text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to News
        </Link>

<footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

      </section>

    </main>
  );
}