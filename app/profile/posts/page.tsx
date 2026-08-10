"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type CommunityPost = {
  id: number;
  user_id: string;
  username: string;
  title: string;
  category: string;
  content: string;
  image: string;
  created_at: string;
  like_count: number;
  avatar?: string;
  comment_count?: number;
};

export default function MyPostsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

    useEffect(() => {
    async function loadPosts() {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("community")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const formattedPosts = await Promise.all(

        (data ?? []).map(async (post) => {

          const { count } = await supabase
            .from("comments")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("post_id", post.id);

          return {
            ...post,
            username: profile?.username ?? "",
            avatar: profile?.avatar ?? "",
            comment_count: count ?? 0,
          };

        })

      );

      setPosts(formattedPosts);
      setLoading(false);

    }

    loadPosts();

  }, [router]);

  async function deletePost(postId: number) {

  const confirmDelete = confirm(
    "Delete this post?"
  );

  if (!confirmDelete) return;

  await supabase
    .from("comments")
    .delete()
    .eq("post_id", postId);

  await supabase
    .from("community_likes")
    .delete()
    .eq("post_id", postId);

  const { error } = await supabase
    .from("community")
    .delete()
    .eq("id", postId);

  if (error) {
    alert(error.message);
    return;
  }

  setPosts((prev) =>
    prev.filter((post) => post.id !== postId)
  );

}

return (
  <main className="min-h-screen bg-black text-white">

    <Navbar />

    <section className="max-w-5xl mx-auto pt-32 px-6">

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">

        <div>
          <h1 className="text-5xl font-bold text-yellow-400">
            📄 My Posts
          </h1>

          <p className="text-gray-400 mt-2">
            All posts you have shared with the community.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

  <Link href="/community">
    <button className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-xl font-bold transition">
      🌎 Community Feed
    </button>
  </Link>

  <Link href="/community/new">
    <button className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition">
      ➕ Create Post
    </button>
  </Link>

</div>

      </div>

      <input
  type="text"
  placeholder="🔍 Search my posts..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full mb-8 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 focus:border-yellow-500 outline-none"
/>

      {loading ? (
        

        <p className="text-center text-gray-400">
          Loading...
        </p>

      ) : posts.length === 0 ? (

        

        <div className="text-center text-gray-500 py-20">
          You have not posted anything yet.
        </div>

      ) : (

        <div className="space-y-8">

          {posts
  .filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase())
  )
  .map((post) => (

            <div
              key={post.id}
              className="bg-zinc-900 rounded-2xl p-6 border border-zinc-700"
            >

              <div className="flex items-center gap-3 mb-4">
              <Link href={`/profile/${post.user_id}`}>
                {post.avatar ? (
                  <img
                    src={post.avatar}
                    alt={post.username}
                    className="w-12 h-12 rounded-full object-cover border border-yellow-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                    👤
                  </div>
                )}
                </Link>

                <div>
                  <Link
  href={`/profile/${post.user_id}`}
  className="font-bold text-yellow-400 hover:text-yellow-300 transition"
>
  {post.username}
</Link>

                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>

              </div>

              <p className="text-yellow-400 font-semibold mb-2">
                {post.category}
              </p>

              {post.image && (
  <Link href={`/community/${post.id}`}>
    <img
      src={post.image}
      alt={post.title}
      className="w-full rounded-xl mb-5 border border-zinc-700 hover:border-yellow-500 transition cursor-pointer"
    />
  </Link>
)}

              <Link href={`/community/${post.id}`}>
  <h2 className="text-2xl font-bold mb-3 hover:text-yellow-400 transition cursor-pointer">
    {post.title}
  </h2>
</Link>

              <Link href={`/community/${post.id}`}>
  <p className="text-gray-300 whitespace-pre-wrap hover:text-yellow-300 transition cursor-pointer">
    {post.content}
  </p>
</Link>

              <div className="flex items-center gap-6 mt-6 text-gray-400">

                <span>
                  ❤️ {post.like_count}
                </span>

                <span>
                  💬 {post.comment_count ?? 0}
                </span>

              </div>

              <div className="flex gap-3 mt-6">

                <Link href={`/community/${post.id}/edit`}>
                  <button className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2 rounded-xl font-bold transition">
                    ✏️ Edit
                  </button>
                </Link>

                <button
                  onClick={() => deletePost(post.id)}
                  className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-xl font-bold transition"
                >
                  🗑 Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

      <footer className="mt-24 mb-10 text-center text-gray-600 text-sm">
        © Alamatika. All Rights Reserved.
      </footer>

    </section>

  </main>
);
}