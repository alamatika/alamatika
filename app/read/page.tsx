import { createSupabaseServerClient } from "../../lib/supabaseServer";
import Navbar from "../../components/navbar";
import Link from "next/link";

export default async function Read() {
  const supabase = await createSupabaseServerClient();

  const { data: appearanceRows } = await supabase
    .from("appearance")
    .select("*");

  const appearance: Record<string, string> = {};

  appearanceRows?.forEach((item) => {
    appearance[item.key] = item.value;
  });

  const { data: stories, error } = await supabase
  .from("stories")
  .select(`
    id,
    title,
    description,
    cover_image,
    published,
    created_at
  `)
    .eq("published", true)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("Error loading stories:", error);

    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="pt-32 text-center">
          <p className="text-red-400">
            Error loading stories.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white pt-24 md:pt-32 px-4 md:px-6"
      style={{
        backgroundImage: `url(${
          appearance.read_background ??
          "/backgrounds/read.jpg"
        })`,
      }}
    >
      <Navbar />

      <section className="w-full max-w-6xl mx-auto">

        <h1 className="text-3xl md:text-4xl font-bold text-center text-yellow-400 mb-4">
          Stories
        </h1>

        <p className="text-gray-400 text-center mb-10">
          Choose a story to begin reading.
        </p>

        {stories?.length === 0 ? (

          <div className="text-center text-gray-500 py-20">
            No stories are available yet.
          </div>

        ) : (

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">

            {stories?.map((story) => {

              return (
                <Link
                  key={story.id}
                  href={`/read/story/${story.id}`}
                  className="bg-zinc-900/90 rounded-2xl overflow-hidden border border-zinc-800 hover:border-yellow-500 transition"
                >

                  {story.cover_image ? (
                    <img
                      src={story.cover_image}
                      alt={story.title}
                      className="w-full aspect-[3/4] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-zinc-800 flex items-center justify-center text-gray-500">
                      No Cover
                    </div>
                  )}

                  <div className="p-3 sm:p-4 md:p-5">

                    <h2 className="text-base sm:text-xl md:text-2xl font-bold text-yellow-400 leading-tight">
                      {story.title}
                     </h2>

                    <p className="text-gray-400 mt-3 line-clamp-3">
                      {story.description ||
                        "No description yet."}
                    </p>

                  </div>

                </Link>
              );
            })}

          </div>

        )}

      </section>

      <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

    </main>
  );
}