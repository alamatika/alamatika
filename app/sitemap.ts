import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://alamatika.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data: stories, error: storiesError } =
    await supabase
      .from("stories")
      .select("id")
      .eq("published", true);

  if (storiesError) {
    console.error(
      "Sitemap story query error:",
      storiesError
    );

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }

  if (!stories || stories.length === 0) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }

  const storyIds = stories.map(
    (story) => story.id
  );

  const { data: seasons, error: seasonsError } =
    await supabase
      .from("seasons")
      .select("id, story_id")
      .in("story_id", storyIds);

  if (seasonsError) {
    console.error(
      "Sitemap season query error:",
      seasonsError
    );

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }

  if (!seasons || seasons.length === 0) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }

  const seasonIds = seasons.map(
    (season) => season.id
  );

  const seasonMap = new Map(
    seasons.map((season) => [
      season.id,
      season.story_id,
    ])
  );

  const { data: chapters, error: chaptersError } =
    await supabase
      .from("chapters")
      .select(
        "id, chapter, season_id, published"
      )
      .in("season_id", seasonIds)
      .eq("published", true);

  if (chaptersError) {
    console.error(
      "Sitemap chapter query error:",
      chaptersError
    );

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }

  const chapterUrls: MetadataRoute.Sitemap =
    (chapters ?? [])
      .filter((chapter) => {
        return (
          chapter.season_id &&
          seasonMap.has(chapter.season_id)
        );
      })
      .map((chapter) => {
        const season =
          seasons.find(
            (item) =>
              item.id ===
              chapter.season_id
          );

        return {
          url:
            `${baseUrl}/read/story/` +
            `${season?.story_id}/season/` +
            `${chapter.season_id}/chapter-` +
            `${chapter.chapter}`,
          lastModified: new Date(),
        };
      });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...chapterUrls,
  ];
}