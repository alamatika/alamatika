"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../components/navbar";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

type SiteContent = {
  key: string;
  title: string;
  content: string;
};

export default function InfoPage() {
  const params = useParams();
  const key = params.key as string;

  const [page, setPage] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", key)
        .single();

      if (!error) {
        setPage(data);
      }

      setLoading(false);
    };

    loadPage();
  }, [key]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (!page) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Page not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-5xl mx-auto pt-32 px-6">
        <Link
          href="/"
          className="text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Home
        </Link>

        <h1 className="text-5xl font-bold text-yellow-400 mt-8 mb-10">
          {page.title}
        </h1>

        <div className="whitespace-pre-wrap text-gray-300 leading-9 text-lg">
          {page.content}
        </div>

        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
          © Alamatika. All Rights Reserved.
          <br />
          Version 1.0.0
        </footer>
      </section>
    </main>
  );
}