"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  chapterId: string | number;
  chapterNumber: string | number;
  chapterTitle: string;
};

export default function DeleteChapterButton({
  chapterId,
  chapterNumber,
  chapterTitle,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] =
    useState(false);

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `Delete Chapter ${chapterNumber}: "${chapterTitle}"?\n\nThis will permanently delete the chapter and its images.`
      );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response =
        await fetch(
          "/api/creator/chapter-delete",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              chapterId,
            }),
          }
        );

      const responseText =
  await response.text();

let result: {
  error?: string;
  success?: boolean;
};

try {
  result =
    JSON.parse(responseText);
} catch {
  console.error(
    "Chapter delete API returned non-JSON:",
    {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    }
  );

  alert(
    `Delete API error (${response.status}). Check the terminal for details.`
  );
  return;
}

if (!response.ok) {
  alert(
    result?.error ??
      "Failed to delete chapter."
  );
  return;
}

      alert("Chapter deleted!");

      router.refresh();
    } catch (error) {
      console.error(
        "Delete chapter request error:",
        error
      );

      alert(
        "Something went wrong while deleting the chapter."
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
      className="px-4 py-3 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting
        ? "⏳ Deleting..."
        : "🗑 Delete"}
    </button>
  );
}