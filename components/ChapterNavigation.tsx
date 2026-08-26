import Link from "next/link";

type Props = {
  current: number;
  total: number;
  storyId?: number | string;
  seasonId?: number | string;
};

export default function ChapterNavigation({
  current,
  total,
  storyId,
  seasonId,
}: Props) {
  const getChapterUrl = (
    chapterNumber: number
  ) => {
    if (
      storyId !== undefined &&
      seasonId !== undefined
    ) {
      return `/read/story/${storyId}/season/${seasonId}/chapter-${chapterNumber}`;
    }

    return `/read/chapter-${chapterNumber}`;
  };

  return (
    <div className="mt-16 flex flex-col items-center gap-6">

      <div className="flex items-center gap-10">

        {current > 1 ? (
          <Link
            href={getChapterUrl(
              current - 1
            )}
            className="text-yellow-400 hover:text-yellow-300"
          >
            ← Previous
          </Link>
        ) : (
          <span className="text-gray-600">
            ← Previous
          </span>
        )}

        <span className="text-lg font-bold text-yellow-400">
          Chapter {current} of {total}
        </span>

        {current < total ? (
          <Link
            href={getChapterUrl(
              current + 1
            )}
            className="text-yellow-400 hover:text-yellow-300"
          >
            Next →
          </Link>
        ) : (
          <span className="text-gray-600">
            Next →
          </span>
        )}

      </div>

      <div className="flex flex-wrap justify-center gap-2">

        {Array.from(
          { length: total },
          (_, i) => {
            const chapter = i + 1;

            return (
              <Link
                key={chapter}
                href={getChapterUrl(
                  chapter
                )}
                className={`px-4 py-2 rounded-lg border transition ${
                  current === chapter
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "border-zinc-700 hover:border-yellow-500"
                }`}
              >
                {chapter}
              </Link>
            );
          }
        )}

      </div>

    </div>
  );
}
