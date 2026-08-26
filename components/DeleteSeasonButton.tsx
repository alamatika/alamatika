"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  storyId: string | number;
  seasonId: string | number;
  seasonNumber: string | number;
  seasonTitle: string;
};

export default function DeleteSeasonButton({
  storyId,
  seasonId,
  seasonNumber,
  seasonTitle,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] =
    useState(false);

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `Delete Season ${seasonNumber}: "${seasonTitle}"?`
      );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response =
        await fetch(
          "/api/creator/season-delete",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              storyId,
              seasonId,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result?.error ??
            "Failed to delete season."
        );
        return;
      }

      alert("Season deleted!");

      router.push(
        `/creator/stories/${storyId}`
      );
    } catch (error) {
      console.error(
        "Delete season request error:",
        error
      );

      alert(
        "Something went wrong while deleting the season."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex px-3 py-2 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting
        ? "⏳ Deleting..."
        : "🗑 Delete Season"}
    </button>
  );
}