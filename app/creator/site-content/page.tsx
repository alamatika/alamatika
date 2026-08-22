"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";
import { supabase } from "../../../lib/supabaseClient";

type SiteContent = {
  key: string;
  title: string;
  content: string;
};

export default function SiteContentCreator() {
  const [pages, setPages] = useState<SiteContent[]>([]);

  async function loadPages() {
    const { data } = await supabase
      .from("site_content")
      .select("*")
      .order("title");

    setPages(data ?? []);
  }

  useEffect(() => {
  const init = async () => {
    await loadPages();
  };

  init();
}, []);

  async function savePage(page: SiteContent) {
    const response = await fetch("/api/update-site-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(page),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error);
      return;
    }

    alert(`${page.title} saved!`);
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-5xl mx-auto pt-32 px-6">

          <h1 className="text-5xl font-bold text-yellow-400 mb-10">
            Site Content
          </h1>

          <div className="space-y-10">

            {pages.map((page, index) => (

              <div
                key={page.key}
                className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6"
              >

                <h2 className="text-2xl font-bold mb-5">
                  {page.title}
                </h2>

                <textarea
                  value={page.content}
                  onChange={(e) => {
                    const updated = [...pages];
                    updated[index].content = e.target.value;
                    setPages(updated);
                  }}
                  rows={12}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 p-4"
                />

                <button
                  onClick={() => savePage(page)}
                  className="mt-5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl"
                >
                  💾 Save
                </button>

              </div>

            ))}

          </div>

        </section>
      </main>
    </CreatorGuard>
  );
}