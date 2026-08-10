"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  chapterId: number;
  initialBookmarked: boolean;
};

export default function BookmarkButton({
  chapterId,
  initialBookmarked,
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  async function toggleBookmark() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in.");
      return;
    }

    if (bookmarked) {
  const { error } = await supabase
    .from("chapter_bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId);

  console.log("DELETE ERROR:", error);

  if (!error) {
    setBookmarked(false);
  }
} else {
  const { data, error } = await supabase
    .from("chapter_bookmarks")
    .insert({
      user_id: user.id,
      chapter_id: chapterId,
    });

  console.log("INSERT DATA:", data);
  console.log("INSERT ERROR:", error);

  if (!error) {
    setBookmarked(true);
  }
}
  }
  return (
    <button
      onClick={toggleBookmark}
      className="mt-1 w-full px-1 py-1 rounded-full border border-yellow-500 text-yellow-400 text-sm hover:bg-yellow-500 hover:text-black transition font-bold"
    >
      {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
    </button>
  );
}