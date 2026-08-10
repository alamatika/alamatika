"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";

export default function AppearancePage() {
  const [appearance, setAppearance] = useState<Record<string, string>>({});

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});


  async function loadAppearance() {
    const { data, error } = await supabase
      .from("appearance")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    const map: Record<string, string> = {};

    data?.forEach((item) => {
      map[item.key] = item.value;
    });

    setAppearance(map);

    
  }

  async function uploadImage(file: File, key: string) {
    const fileName = `${key}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("site-assets")
      .upload(fileName, file, {
        upsert: true,
      });

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("site-assets")
      .getPublicUrl(fileName);


    setAppearance((prev) => ({
      ...prev,
      [key]: publicUrl,
    }));

    alert("Updated!");
  }

  async function saveAppearance() {
  console.log(appearance);

  for (const key in appearance) {
    console.log("Updating:", key);

    const { data, error } = await supabase
      .from("appearance")
      .update({
        value: appearance[key],
      })
      .eq("key", key)
      .select();

    console.log("Returned:", data);
    console.log("Error:", error);
  }

  alert("Done");
}

useEffect(() => {
  async function init() {
    await loadAppearance();
  }

  init();
}, []);

  const sections = [
    {
      title: "Homepage",
      items: [
        {
          key: "homepage_background",
          label: "Background",
        },
        {
          key: "homepage_logo",
          label: "Logo",
        },
      ],
    },
    {
      title: "Read",
      items: [
        {
          key: "read_background",
          label: "Background",
        },
        {
          key: "read_logo",
          label: "Logo",
        },
      ],
    },
    {
      title: "Characters",
      items: [
        {
          key: "characters_background",
          label: "Background",
        },
        {
          key: "characters_logo",
          label: "Logo",
        },
      ],
    },
    {
      title: "Lore",
      items: [
        {
          key: "lore_background",
          label: "Background",
        },
        {
          key: "lore_logo",
          label: "Logo",
        },
      ],
    },
    {
      title: "Community",
      items: [
        {
          key: "community_background",
          label: "Background",
        },
        {
          key: "community_logo",
          label: "Logo",
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          key: "about_background",
          label: "Background",
        },
        {
          key: "about_logo",
          label: "Logo",
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-6xl mx-auto pt-32 px-6">

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mb-8 md:mb-10">
  🎨 Appearance
</h1>

        <div className="space-y-10">

          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-zinc-900 rounded-2xl p-5 sm:p-6 md:p-8"
            >

              <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-6 md:mb-8">
                {section.title}
              </h2>

              <div className="grid md:grid-cols-2 gap-8">

                {section.items.map((item) => (
                  <div key={item.key}>

                    <h3 className="text-xl font-bold mb-4">
                      {item.label}
                    </h3>

                    <div className="h-56 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center">

                      {appearance[item.key] ? (
                        <img
                          src={appearance[item.key]}
                          className="w-full h-full object-cover"
                          alt={item.label}
                        />
                      ) : (
                        <span className="text-gray-500">
                          No image uploaded
                        </span>
                      )}

                    </div>

                    <button
                      onClick={() =>
                        fileRefs.current[item.key]?.click()
                      }
                      className="mt-5 w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl transition"
                    >
                      Upload {item.label}
                    </button>

                    <input
                      ref={(el) => {
                        fileRefs.current[item.key] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        uploadImage(file, item.key);
                      }}
                    />

                  </div>
                ))}

              </div>

            </div>
          ))}

          <div className="mt-10 md:mt-12 flex justify-stretch sm:justify-end">
  <button
    onClick={saveAppearance}
    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition"
  >
    💾 Save Changes
  </button>
</div>

        </div>

      </section>
    </main>
  );
}