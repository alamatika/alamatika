import Link from "next/link";
import Navbar from "../../../../components/navbar";
import CreatorGuard from "../../../../components/CreatorGuard";

interface Props {
  params: {
    folder: string;
  };
}

export default function AssetFolder({ params }: Props) {
  return (
    <CreatorGuard>
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

        <section className="max-w-6xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

  <Link
    href="/creator/assets"
    className="inline-flex items-center py-2 text-yellow-400 hover:text-yellow-300 transition"
  >
    ← Back to Assets
  </Link>

  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mt-5 md:mt-6 break-words">
    {params.folder}
  </h1>

  <p className="text-gray-400 mt-3">
    Manage your uploaded assets.
  </p>

</section>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mt-5 md:mt-6 break-words">
  {params.folder}
</h1>

        <p className="text-gray-400 mt-3">
          Manage your uploaded assets.
        </p>

      </section>
    </main>
    </CreatorGuard>
  );
}