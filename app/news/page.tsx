"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/navbar";
import Link from "next/link";

type News = {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string;
  created_at: string;
};

export default function News() {

const [newsPosts, setNewsPosts] = useState<News[]>([]);

useEffect(() => {
  async function loadNews() {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    setNewsPosts(data ?? []);
  }

  loadNews();
}, []);

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white pt-32 px-6"
      style={{
        backgroundImage: "url('/backgrounds/home-v3.jpg')",
      }}
    >
      <Navbar />

      <section className="max-w-5xl mx-auto">

        <h1 className="text-3xl md:text-5xl font-bold text-center text-yellow-400 mb-4">
          News
        </h1>

        <p className="text-center text-sm md:text-base text-gray-300 mb-10 md:mb-16 px-2">
          Stay updated with the latest Alamatika announcements.
        </p>

        <div className="space-y-5 md:space-y-8">

  {newsPosts.map((post) => (

    <Link
      key={post.id}
      href={`/news/${post.id}`}
      className="block bg-black/50 rounded-3xl p-5 md:p-8 border border-yellow-500/20 hover:scale-[1.02] transition"
    >

      <p className="text-xs md:text-sm text-gray-400">
        {new Date(post.created_at).toLocaleDateString()}
      </p>

      <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mt-2">
        {post.title}
      </h2>

      <p className="text-sm md:text-base text-gray-300 mt-4 leading-7 md:leading-8">
        {post.summary}
      </p>

    </Link>

  ))}

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