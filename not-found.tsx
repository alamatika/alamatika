import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-7xl font-bold text-yellow-400">
        404
      </h1>

      <h2 className="text-3xl font-bold mt-6">
        This page does not exist.
      </h2>

      <p className="text-gray-400 mt-4 text-center max-w-lg">
        The page you are looking for may have been moved,
        deleted, or never existed.
      </p>

      <Link
        href="/"
        className="mt-10 px-8 py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
      >
        Return Home
      </Link>

    </main>
  );
}