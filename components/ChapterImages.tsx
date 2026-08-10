"use client";

import { useEffect, useState } from "react";

export default function ChapterImages({
  images,
}: {
  images: string[];
}) {

const [isFullscreen, setIsFullscreen] = useState(false);
const [loadedImages, setLoadedImages] = useState<boolean[]>([]);

useEffect(() => {
  const handleKeyDown = async (e: KeyboardEvent) => {
    const reader = document.getElementById("reader");

    switch (e.key) {
      case "f":
      case "F":
        if (!reader) return;

        if (!document.fullscreenElement) {
          await reader.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
        break;

      case "ArrowDown":
        e.preventDefault();

        window.scrollBy({
          top: window.innerHeight * 0.9,
          behavior: "smooth",
        });
        break;

      case "ArrowUp":
        e.preventDefault();

        window.scrollBy({
          top: -window.innerHeight * 0.9,
          behavior: "smooth",
        });
        break;
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  window.addEventListener("keydown", handleKeyDown);
  document.addEventListener(
    "fullscreenchange",
    handleFullscreenChange
  );

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );
  };
}, []);

  async function toggleFullscreen() {
    const reader = document.getElementById("reader");

    if (!reader) return;

    if (!document.fullscreenElement) {
      await reader.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

 return (
  <div id="reader">
    <div className="flex justify-end mb-6">
     
    </div>

    {images.map((image, index) => (
  <div key={index} className="relative mx-auto mb-8 max-w-full">

    {!loadedImages[index] && (
      <div
        className="
          w-full
          h-[700px]
          animate-pulse
          rounded-lg
          bg-zinc-800
        "
      />
    )}

    <img
      src={image}
      alt={`Page ${index + 1}`}
      onLoad={() =>
        setLoadedImages((prev) => {
          const copy = [...prev];
          copy[index] = true;
          return copy;
        })
      }
      className={`
        max-w-full
        rounded-lg
        ${loadedImages[index] ? "block" : "hidden"}
      `}
    />

  </div>
))}
  </div>
);
}