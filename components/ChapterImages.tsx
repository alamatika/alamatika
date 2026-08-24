"use client";

import { useEffect, useState } from "react";

export default function ChapterImages({
  images,
}: {
  images: string[];
}) {
  const [loadedImages, setLoadedImages] = useState<boolean[]>(
    []
  );

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const reader = document.getElementById("reader");

      switch (e.key) {
        case "f":
        case "F":
          if (!reader) return;

          if (!document.fullscreenElement) {
            try {
              await reader.requestFullscreen();
            } catch (error) {
              console.error(
                "Unable to enter fullscreen:",
                error
              );
            }
          } else {
            try {
              await document.exitFullscreen();
            } catch (error) {
              console.error(
                "Unable to exit fullscreen:",
                error
              );
            }
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

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  function markLoaded(index: number) {
    setLoadedImages((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }

  if (images.length === 0) {
    return (
      <div className="text-center text-gray-500 py-20">
        No pages available.
      </div>
    );
  }

  return (
    <div>
      {images.map((image, index) => {
        const isFirstPage = index === 0;
        const isLoaded = loadedImages[index];

        return (
          <div
            key={`${image}-${index}`}
            className="relative mx-auto mb-8 max-w-3xl"
          >
            {!isLoaded && (
              <div
                className="
                  w-full
                  min-h-[300px]
                  sm:min-h-[450px]
                  md:min-h-[600px]
                  rounded-lg
                  bg-zinc-800
                  animate-pulse
                "
              />
            )}

            <img
              src={image}
              alt={`Page ${index + 1}`}
              loading={
                isFirstPage
                  ? "eager"
                  : "lazy"
              }
              decoding="async"
              fetchPriority={
                isFirstPage
                  ? "high"
                  : "auto"
              }
              onLoad={() => markLoaded(index)}
              onError={(e) => {
                const target =
                  e.currentTarget;

                target.style.display = "none";
              }}
              className={`
                w-full
                max-w-3xl
                mx-auto
                rounded-lg
                ${
                  isLoaded
                    ? "block"
                    : "absolute opacity-0"
                }
              `}
            />
          </div>
        );
      })}
    </div>
  );
}