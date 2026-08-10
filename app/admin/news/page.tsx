"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";
import Link from "next/link";

type News = {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string;
  created_at: string;
};

export default function NewsManager() {

const [newsPosts, setNewsPosts] = useState<News[]>([]);

useEffect(() => {

  async function loadNews() {

    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setNewsPosts(data ?? []);
  }

  loadNews();

}, []);
  
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

        
        <h1 className="text-5xl font-bold text-yellow-400">
          News Manager
        </h1>

        <p className="text-gray-400 mt-3">
          Share updates with your readers.
        </p>

        <Link href="/admin/news/new">
          <button className="mt-10 px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition">
            ✨ New Post
          </button>
        </Link>

        <div className="mt-12 space-y-6">

  {newsPosts.length === 0 && (

    <div className="text-gray-400">
      No news yet.
    </div>

  )}

  {newsPosts.map((post) => (

    <div
  key={post.id}
  className="bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-5"
>

      <div>

        <h2 className="text-2xl font-bold">
          {post.title}
        </h2>

        <p className="text-gray-400">
          {new Date(post.created_at).toLocaleDateString()}
        </p>

      </div>

      <div className="flex flex-col sm:flex-row gap-3">

        <Link href={`/admin/news/${post.id}`}>
  <button className="w-full sm:w-auto px-5 py-2 rounded-lg border border-yellow-500 hover:bg-yellow-500 hover:text-black transition">
    Edit
  </button>
</Link>

<button
  onClick={async () => {
    const confirmed = confirm("Delete this news post?");

    if (!confirmed) return;

    await supabase
      .from("news")
      .delete()
      .eq("id", post.id);

    setNewsPosts((current) =>
      current.filter((n) => n.id !== post.id)
    );
  }}
  className="w-full sm:w-auto px-5 py-2 rounded-lg border border-red-500 hover:bg-red-500 transition"
>
  Delete
</button>

      </div>

    </div>

  ))}

</div>


      <footer className="mt-24 mb-10 text-gray-600 text-sm text-center hover:text-black transition">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>
      
      </section>

    </main>
  );
}