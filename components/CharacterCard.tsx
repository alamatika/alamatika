import Image from "next/image";
import Link from "next/link";

type CharacterCardProps = {
  name: string;
  title: string;
  image: string;
  link: string;
};

export default function CharacterCard({
  name,
  title,
  image,
  link,
}: CharacterCardProps) {
  return (
    <div className="bg-black/50 backdrop-blur-md rounded-3xl overflow-hidden border border-yellow-500/20 hover:scale-105 transition duration-300">

      <div className="w-full h-72 md:h-80 bg-zinc-900 rounded-t-3xl overflow-hidden flex items-center justify-center">
  <Image
    src={image}
    alt={name}
    width={240}
    height={320}
    className="w-full h-full object-contain"
  />
</div>

      <div className="p-3 md:p-4 text-center">

        <h3 className="text-base md:text-lg font-bold text-yellow-400">
          {name}
        </h3>

        <p className="text-[11px] md:text-xs text-gray-300 mt-1">
          {title}
        </p>

        <Link
          href={link}
          className="inline-block mt-3 px-3 md:px-4 py-2 text-xs font-bold border border-yellow-500 rounded-full text-yellow-400 hover:bg-yellow-500 hover:text-black transition"
        >
          View Profile
        </Link>

      </div>

    </div>
  );
}