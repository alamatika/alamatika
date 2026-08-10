"use client";

import Image from "next/image";
import Navbar from "../components/navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";



export default function Home() {

  const [appearance, setAppearance] = useState<
  Record<string, string>
>({});

useEffect(() => {
  async function loadAppearance() {
    const { data } = await supabase
      .from("appearance")
      .select("*");

    if (!data) return;

    const map: Record<string, string> = {};

    data.forEach((item) => {
      map[item.key] = item.value;
    });

    setAppearance(map);
  }

  loadAppearance();
}, []);

  return (
    <main className="min-h-screen bg-cover bg-center bg-no-repeat text-white flex flex-col items-center justify-center px-6"
  style={{
  backgroundImage: `url(${
    appearance.homepage_background ??
    "/backgrounds/home-v3.jpg"
  })`,
}}
>
<Navbar />
      <Image
  src={
    appearance.homepage_logo ??
    "/logos/alamatika-logo-gold1.png"
  }
  alt="Alamatika Logo"
  width={900}
  height={320}
  priority
  className="mt-16 w-[90%] max-w-[900px] h-auto"
/>

      <p className="mt-8 text-lg sm:text-xl md:text-2xl text-center max-w-2xl text-gray-300 italic px-4">
        Every mountain, sea, land and sky has stories.
      </p>

      <Link href="/read">
      <button className="mt-12 w-full max-w-sm px-8 py-4 rounded-full border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition text-lg font-semibold">
        BEGIN THE JOURNEY
      </button>
      </Link>
      
      <div className="mt-6 text-center">
  <Link
    href="/community"
    className="text-gray-400 hover:text-yellow-400 transition"
  >
    Join our community →
  </Link>
</div>

      <div className="mt-20 text-center max-w-3xl px-4">
        <h2 className="text-3xl text-yellow-400 font-bold">
          Official Notice
        </h2>

        <p className="mt-4 text-gray-400 leading-8">
          This is the official Alamatika website.
          <br />
          We will never ask for payments through private messages,
          unofficial accounts, or unofficial websites.
          <br /><br />
          Please refer only to the official links published here.
        </p>
      </div>

      <footer className="mt-20 mb-10 text-gray-600 text-xs sm:text-sm text-center px-4">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

    </main>
  );
}