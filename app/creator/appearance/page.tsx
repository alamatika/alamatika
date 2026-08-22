"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";

export default function AppearancePage() {
  const [appearance, setAppearance] = useState<Record<string, string>>({});
  const [characterX, setCharacterX] = useState(50);
const [characterY, setCharacterY] = useState(70);
const [characterWidth, setCharacterWidth] = useState(35);

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

function handleCharacterDrag(
  e: React.PointerEvent<HTMLVideoElement>
) {
  const preview = previewRef.current;

  if (!preview) return;

  const rect = preview.getBoundingClientRect();

  const x =
    ((e.clientX - rect.left) / rect.width) * 100;

  const y =
    ((e.clientY - rect.top) / rect.height) * 100;

  setCharacterX(
    Math.max(0, Math.min(100, Math.round(x)))
  );

  setCharacterY(
    Math.max(0, Math.min(100, Math.round(y)))
  );
}

function handleCharacterResize(
  e: React.PointerEvent<HTMLDivElement>
) {
  const preview = previewRef.current;

  if (!preview) return;

  const rect = preview.getBoundingClientRect();

  // Distance from Huni's center to the pointer
  const centerX = (characterX / 100) * rect.width;
  const centerY = (characterY / 100) * rect.height;

  const distance = Math.sqrt(
    Math.pow(e.clientX - rect.left - centerX, 2) +
    Math.pow(e.clientY - rect.top - centerY, 2)
  );

  // Convert the distance into a percentage of preview width
  const newWidth =
    (distance * 2 / rect.width) * 100;

  setCharacterWidth(
    Math.max(
      10,
      Math.min(100, Math.round(newWidth))
    )
  );
}

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
    
    setCharacterX(
  Number(map.homepage_character_video_x ?? 50)
);

setCharacterY(
  Number(map.homepage_character_video_y ?? 70)
);

setCharacterWidth(
  Number(map.homepage_character_video_width ?? 35)
);
    
  }

 async function uploadAsset(file: File, key: string) {
  try {
    setUploadingKey(key);

    // Remember the currently used file
    const oldUrl = appearance[key];

    // Create a unique filename
    const fileName = `${key}-${Date.now()}-${file.name}`;

    // ----------------------------------------
    // 1. Upload the new file
    // ----------------------------------------

    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(fileName, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert(uploadError.message);
      return;
    }

    // ----------------------------------------
    // 2. Get new public URL
    // ----------------------------------------

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("site-assets")
      .getPublicUrl(fileName);

    // ----------------------------------------
    // 3. Update appearance table
    // ----------------------------------------

    const { error: updateError } = await supabase
      .from("appearance")
      .update({
        value: publicUrl,
      })
      .eq("key", key);

    if (updateError) {
      console.error(
        "Appearance update error:",
        updateError
      );

      // Remove new file because database update failed
      await supabase.storage
        .from("site-assets")
        .remove([fileName]);

      alert(updateError.message);
      return;
    }

    // ----------------------------------------
    // 4. Update page immediately
    // ----------------------------------------

    setAppearance((prev) => ({
      ...prev,
      [key]: publicUrl,
    }));

    // ----------------------------------------
    // 5. Delete OLD file
    // ----------------------------------------

    if (oldUrl) {
      try {
        const marker = "/site-assets/";

        const markerIndex = oldUrl.indexOf(marker);

        if (markerIndex !== -1) {
          const oldPath = decodeURIComponent(
            oldUrl.substring(
              markerIndex + marker.length
            )
          );

          if (
            oldPath &&
            oldPath !== fileName
          ) {
            const { error: deleteError } =
              await supabase.storage
                .from("site-assets")
                .remove([oldPath]);

            if (deleteError) {
              console.error(
                "Old file cleanup error:",
                deleteError
              );
            }
          }
        }
      } catch (cleanupError) {
        console.error(
          "Old file cleanup failed:",
          cleanupError
        );
      }
    }

    alert("Updated!");

  } catch (error) {
    console.error("Upload error:", error);
    alert("Upload failed.");

  } finally {
    setUploadingKey(null);
  }
}
async function deleteAsset(key: string) {
  const url = appearance[key];

  if (!url) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this asset?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setUploadingKey(key);

    // ----------------------------------------
    // 1. Get the storage filename
    // ----------------------------------------

    const marker = "/site-assets/";

    const markerIndex = url.indexOf(marker);

    if (markerIndex === -1) {
      alert("Could not determine the storage file.");
      return;
    }

    const oldPath = decodeURIComponent(
      url.substring(
        markerIndex + marker.length
      )
    );

    // ----------------------------------------
    // 2. Delete from Supabase Storage
    // ----------------------------------------

    const { error: storageError } =
      await supabase.storage
        .from("site-assets")
        .remove([oldPath]);

    if (storageError) {
      console.error(
        "Storage delete error:",
        storageError
      );

      alert(storageError.message);
      return;
    }

    // ----------------------------------------
    // 3. Clear appearance table
    // ----------------------------------------

    const { error: databaseError } =
      await supabase
        .from("appearance")
        .update({
          value: null,
        })
        .eq("key", key);

    if (databaseError) {
      console.error(
        "Appearance delete error:",
        databaseError
      );

      alert(databaseError.message);
      return;
    }

    // ----------------------------------------
    // 4. Remove from local state
    // ----------------------------------------

    setAppearance((prev) => ({
      ...prev,
      [key]: "",
    }));

    alert("Asset deleted.");

  } catch (error) {
    console.error(
      "Delete asset error:",
      error
    );

    alert("Failed to delete asset.");

  } finally {
    setUploadingKey(null);
  }
}

  async function saveAppearance() {
  try {
    console.log("Saving appearance...");

    // Save normal appearance values
    for (const key in appearance) {
      const { error } = await supabase
        .from("appearance")
        .update({
          value: appearance[key],
        })
        .eq("key", key);

      if (error) {
        console.error(
          `Error updating ${key}:`,
          error
        );

        alert(`Failed to save ${key}.`);
        return;
      }
    }

    // Save Huni position and size
    const characterSettings = [
      {
        key: "homepage_character_video_x",
        value: String(characterX),
      },
      {
        key: "homepage_character_video_y",
        value: String(characterY),
      },
      {
        key: "homepage_character_video_width",
        value: String(characterWidth),
      },
    ];

    for (const setting of characterSettings) {
      const { error } = await supabase
        .from("appearance")
        .update({
          value: setting.value,
        })
        .eq("key", setting.key);

      if (error) {
        console.error(
          `Error updating ${setting.key}:`,
          error
        );

        alert(
          `Failed to save ${setting.key}.`
        );

        return;
      }
    }

    alert("Appearance saved successfully!");

  } catch (error) {
    console.error(
      "Save appearance error:",
      error
    );

    alert("Failed to save appearance.");
  }
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
  key: "homepage_background_video",
  label: "Background Video",
},
{
  key: "homepage_logo",
  label: "Logo",
},
      ],
    },

{
  title: "Homepage Character",
  items: [
    {
      key: "homepage_character_video",
      label: "Character Video",
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
    <CreatorGuard>
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
  item.key === "homepage_background_video" ||
item.key === "homepage_character_video" ? (
    <video
      src={appearance[item.key]}
      className="w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
    />
  ) : (
    <img
      src={appearance[item.key]}
      className="w-full h-full object-cover"
      alt={item.label}
    />
  )
) : (
  <span className="text-gray-500">
    {item.key === "homepage_background_video" ||
item.key === "homepage_character_video"
      ? "No video uploaded"
      : "No image uploaded"}
  </span>
)}

                    </div>

                    <button
  onClick={() =>
    fileRefs.current[item.key]?.click()
  }
  disabled={uploadingKey === item.key}
  className="mt-5 w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:text-gray-400 text-black font-bold px-6 py-3 rounded-xl transition"
>
  {uploadingKey === item.key
    ? "⏳ Uploading..."
    : `Upload ${item.label}`}
</button>

{appearance[item.key] && (
  <button
    onClick={() => deleteAsset(item.key)}
    disabled={uploadingKey === item.key}
    className="mt-3 sm:ml-3 w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-gray-400 text-white font-bold px-6 py-3 rounded-xl transition"
  >
    {uploadingKey === item.key
      ? "⏳ Processing..."
      : "🗑️ Delete"}
  </button>
)}

                    <input
                      ref={(el) => {
                        fileRefs.current[item.key] = el;
                      }}
                      type="file"
                      accept={
  item.key === "homepage_background_video" ||
  item.key === "homepage_character_video"
    ? "video/mp4,video/webm,video/quicktime"
    : "image/*"
}
                      className="hidden"
disabled={uploadingKey === item.key}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        uploadAsset(file, item.key);
                      }}
                    />

                  </div>
                ))}

              </div>

              {section.title === "Homepage Character" && (

  <div className="mt-10 bg-black/40 border border-zinc-700 rounded-2xl p-5 sm:p-6">

    {/* HOMEPAGE PREVIEW */}

    <div className="mb-8">

      <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-4">
        🎬 Homepage Preview
      </h3>

      <div
        ref={previewRef}
        className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700 bg-black"
      >

        {/* BACKGROUND */}

        {appearance.homepage_background ? (
          <img
            src={appearance.homepage_background}
            alt="Homepage background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800" />
        )}

        {/* HUNI */}

        {appearance.homepage_character_video && (
  <div
    className="absolute"
    style={{
      left: `${characterX}%`,
      top: `${characterY}%`,
      width: `${characterWidth}%`,
      aspectRatio: "1 / 1",
      transform: "translate(-50%, -50%)",
    }}
  >

    <video
      src={appearance.homepage_character_video}
      autoPlay
      muted
      loop
      playsInline
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(
          e.pointerId
        );
      }}
      onPointerMove={(e) => {
        if (
          e.currentTarget.hasPointerCapture(
            e.pointerId
          )
        ) {
          handleCharacterDrag(e);
        }
      }}
      className="w-full h-full object-contain cursor-grab active:cursor-grabbing select-none touch-none"
    />

    {/* RESIZE HANDLE */}

    <div
      onPointerDown={(e) => {
        e.stopPropagation();

        e.currentTarget.setPointerCapture(
          e.pointerId
        );
      }}
      onPointerMove={(e) => {
        if (
          e.currentTarget.hasPointerCapture(
            e.pointerId
          )
        ) {
          handleCharacterResize(e);
        }
      }}
      className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-yellow-400 border-2 border-black cursor-nwse-resize z-20"
      title="Drag to resize"
    />

  </div>
)}

        {!appearance.homepage_character_video && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Upload Huni video first.
          </div>
        )}

      </div>

      <p className="text-sm text-gray-500 mt-3 text-center">
        🐦 Drag Huni around the preview to position him.
      </p>

    </div>

    <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-6">
      🐦 Character Position & Size
    </h3>

    {/* HORIZONTAL */}

    <div className="mb-6">

      <div className="flex justify-between mb-2">
        <label className="font-semibold">
          Horizontal Position
        </label>

        <span className="text-yellow-400">
          {characterX}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={characterX}
        onChange={(e) =>
          setCharacterX(Number(e.target.value))
        }
        className="w-full"
      />

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Left</span>
        <span>Center</span>
        <span>Right</span>
      </div>

    </div>


    {/* VERTICAL */}

    <div className="mb-6">

      <div className="flex justify-between mb-2">
        <label className="font-semibold">
          Vertical Position
        </label>

        <span className="text-yellow-400">
          {characterY}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={characterY}
        onChange={(e) =>
          setCharacterY(Number(e.target.value))
        }
        className="w-full"
      />

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Top</span>
        <span>Center</span>
        <span>Bottom</span>
      </div>

    </div>


    {/* SIZE */}

    <div>

      <div className="flex justify-between mb-2">
        <label className="font-semibold">
          Character Size
        </label>

        <span className="text-yellow-400">
          {characterWidth}%
        </span>
      </div>

      <input
        type="range"
        min="10"
        max="100"
        value={characterWidth}
        onChange={(e) =>
          setCharacterWidth(Number(e.target.value))
        }
        className="w-full"
      />

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Small</span>
        <span>Large</span>
      </div>

    </div>

  </div>
)}

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
    </CreatorGuard>
  );
}