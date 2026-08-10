import Image from "next/image";
import Link from "next/link";
import BookmarkButton from "./BookmarkButton";

type ChapterCardProps = {
  chapter: string;
  image: string;
  link: string;
  badge?: string;
  locked?: boolean;
  purchased?: boolean;

  chapterId: number;
  bookmarked: boolean;
};

export default function ChapterCard({
  chapter,
  image,
  link,
  badge,
  locked,
  purchased,
  chapterId,
  bookmarked,
}: ChapterCardProps) {

  return (
    <div className="relative w-full max-w-[170px] bg-black/50 backdrop-blur-md rounded-3xl overflow-hidden border border-yellow-500/20 hover:scale-[1.02] transition duration-300">

      {badge && (
        <div className="absolute top-3 right-3 bg-yellow-400 text-black font-bold px-2 py-1 rounded-full text-xs">
          {badge}
        </div>
      )}

      {image ? (
  <img
  src={image}
  alt={chapter}
  className="w-full aspect-[4/5] object-cover"
/>
) : (
 <div className="w-full h-52 bg-zinc-800 flex items-center justify-center text-gray-500">
    No Cover
  </div>
)}

      <div className="p-3 text-center">

        <h2 className="text-xs font-bold text-yellow-400">
          {chapter}
        </h2>

        <Link
  href={link}
  className={`block w-full mt-3 px-3 py-2 rounded-full text-sm text-center font-bold transition ${
    purchased
      ? "bg-green-600 text-white hover:bg-green-500"
      : locked
      ? "bg-red-600 text-white hover:bg-red-500"
      : "border border-yellow-500 text-yellow-300 hover:bg-yellow-500 hover:text-black"
  }`}
>
  {purchased ? "✓ Purchased" : locked ? "🔒 Locked" : "Read Chapter"}
</Link>

<BookmarkButton
  chapterId={chapterId}
  initialBookmarked={bookmarked}
/>

      </div>
    </div>
  );
}