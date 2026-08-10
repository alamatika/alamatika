"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ChapterRating({
  chapter,
}: {
  chapter: number;
}) {

  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [rating, setRating] = useState(0);

  const loadRatings = useCallback(async () => {
    const { data, error } = await supabase
      .from("chapter_ratings")
      .select("rating")
      .eq("chapter", chapter);

    if (error || !data) return;

    const total = data.length;

    if (total === 0) {
      setAverageRating(0);
      setTotalRatings(0);
      return;
    }

    const sum = data.reduce((acc, row) => acc + row.rating, 0);

    setAverageRating(sum / total);
    setTotalRatings(total);
  }, [chapter]);

  useEffect(() => {
  const fetchRating = async () => {
    await loadRatings();
  };

  fetchRating();
}, [loadRatings]);

  async function submitRating(stars: number) {
    setRating(stars);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      return;
    }

    const { error } = await supabase
      .from("chapter_ratings")
      .upsert(
        {
          chapter,
          user_id: user.id,
          rating: stars,
        },
        {
          onConflict: "chapter,user_id",
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    alert("Thanks for rating!");
    await loadRatings();
  }

  return (
    <div className="mt-16 text-center">
      <h2 className="text-2xl font-bold text-yellow-400">
        Rate this Chapter
      </h2>

      <div className="flex justify-center gap-3 mt-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => submitRating(star)}
            className={`text-4xl transition hover:scale-110 ${
              rating >= star ? "opacity-100" : "opacity-40"
            }`}
          >
            ⭐
          </button>
        ))}
      </div>

      <p className="mt-4 text-gray-300">
        {averageRating.toFixed(1)} / 5
      </p>

      <p className="text-sm text-gray-500">
        {totalRatings} ratings
      </p>
    </div>
  );
}