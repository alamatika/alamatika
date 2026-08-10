"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Comment = {
  id: number;
  user_id: string;
  comment: string;
  created_at: string;
};

export default function ChapterComments({
  chapter,
}: {
  chapter: number;
}) {


const [comment, setComment] = useState("");
const [comments, setComments] = useState<Comment[]>([]);

const loadComments = useCallback(async () => {
  const { data, error } = await supabase
    .from("chapter_comments")
    .select("*")
    .eq("chapter", chapter)
    .order("created_at", { ascending: false });

  if (error || !data) return;

  setComments(data);
}, [chapter]);

async function submitComment() {
  if (!comment.trim()) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const { error } = await supabase
    .from("chapter_comments")
    .insert({
      chapter,
      user_id: user.id,
      comment,
    });

  if (error) {
    alert(error.message);
    return;
  }

  setComment("");
  await loadComments();
}


  useEffect(() => {
    const fetchComments = async () => {
      await loadComments();
    };

    fetchComments();
  }, [loadComments]);

  return (
  <div className="mt-16 max-w-5xl mx-auto">
    <h2 className="text-2xl font-bold text-yellow-400">
      Comments
    </h2>

    <textarea
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      placeholder="Share your thoughts..."
      className="w-full mt-4 p-3 rounded bg-gray-900 border border-gray-700 text-white"
      rows={4}
    />

    <button
      onClick={submitComment}
      className="mt-4 bg-yellow-400 text-black px-5 py-2 rounded font-bold hover:bg-yellow-300"
    >
      Post Comment
    </button>

    <div className="mt-8">
      {comments.map((c) => (
        <div
          key={c.id}
          className="mb-4 p-4 rounded bg-gray-900 border border-gray-700"
        >
          <p>{c.comment}</p>

          <p className="text-xs text-gray-500 mt-2">
            {new Date(c.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  </div>
);
}