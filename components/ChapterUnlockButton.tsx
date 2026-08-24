"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ChapterUnlockButtonProps = {
  chapterId: string;
  chapterNumber: number;
  storyId: string;
  seasonId: string;
};

export default function ChapterUnlockButton({
  chapterId,
  chapterNumber,
  storyId,
  seasonId,
}: ChapterUnlockButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function unlockChapter() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/chapters/unlock",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            chapterId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (
          result.required &&
          result.credits !== undefined
        ) {
          alert(
            `Not enough Credits.\n\nYou have ${result.credits} Credits.\nYou need ${result.required} Credits.`
          );
        } else {
          alert(
            result.error ??
              "Could not unlock the chapter."
          );
        }

        return;
      }

      router.push(
        `/read/story/${storyId}/season/${seasonId}/chapter-${chapterNumber}`
      );

      router.refresh();

    } catch (error) {
      console.error(
        "Unlock error:",
        error
      );

      alert(
        "Something went wrong unlocking the chapter."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={unlockChapter}
      disabled={loading}
      className="inline-block px-8 py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? "Unlocking..."
        : "💎 Unlock for 25 Credits"}
    </button>
  );
}