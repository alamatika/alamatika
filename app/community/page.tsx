"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/navbar";
import Link from "next/link";

type CommunityPost = {
  id: number;
  user_id: string;
  username: string;
  title: string;
  category: string;
  content: string;
  image: string;
  created_at: string;
  is_pinned: boolean;
  like_count: number;
  avatar?: string;
  comment_count?: number;
};

export default function Community() {

const [isAdmin, setIsAdmin] = useState(false);

const [posts, setPosts] = useState<CommunityPost[]>([]);
const [search, setSearch] = useState("");
const [selectedCategory, setSelectedCategory] = useState("All");
const [sortMode, setSortMode] = useState<"Newest" | "Trending">("Newest");
const [currentUserId, setCurrentUserId] = useState("");
const [visiblePosts, setVisiblePosts] = useState(10);


const [appearance, setAppearance] = useState<
  Record<string, string>
>({});

useEffect(() => {
  function handleScroll() {
    const scrollPosition =
      window.innerHeight + window.scrollY;

    const bottom =
      document.documentElement.offsetHeight - 400;

       console.log({
    scrollPosition,
    bottom,
    visiblePosts,
    total: posts.length,
  });

    if (
      scrollPosition >= bottom &&
      visiblePosts < posts.length
    ) {
      console.log("Loading 10 more...");
      setTimeout(() => {
  setVisiblePosts((prev) => prev + 10);
}, 300);
    }
  }

  window.addEventListener("scroll", handleScroll);

  return () =>
    window.removeEventListener("scroll", handleScroll);
}, [visiblePosts, posts.length]);


useEffect(() => {
  async function loadPosts() {
    const { data, error } = await supabase
  .from("community")
  .select("*")
  .order("is_pinned", { ascending: false })
  .order("created_at", { ascending: false });

if (error) {
  console.error(error);
  return;
}

const userIds = [...new Set(data?.map(post => post.user_id) ?? [])];

const { data: profileData } = await supabase
  .from("profiles")
  .select("id, username, avatar")
  .in("id", userIds);

const profileMap = new Map(
  profileData?.map(profile => [
    profile.id,
    {
      username: profile.username,
      avatar: profile.avatar,
    },
  ]) ?? []
);

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
      avatar: profileMap.get(post.user_id)?.avatar ?? "",
username:
  profileMap.get(post.user_id)?.username ??
  post.username,
      comment_count: count ?? 0,
    };

  })
);

setPosts(formattedPosts);

console.log("Total posts:", formattedPosts.length);

    const {
  data: { user },
} = await supabase.auth.getUser();


setCurrentUserId(user?.id ?? "");
if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  setIsAdmin(profile?.is_admin ?? false);
}

const { data: appearanceData } = await supabase
  .from("appearance")
  .select("*");

if (appearanceData) {
  const map: Record<string, string> = {};

  appearanceData.forEach((item) => {
    map[item.key] = item.value;
  });

  setAppearance(map);
}

  }

  loadPosts();
}, []);

async function togglePin(postId: number, pinned: boolean) {

  const { error } = await supabase
    .from("community")
    .update({
      is_pinned: !pinned,
    })
    .eq("id", postId);

  if (error) {
    alert(error.message);
    return;
  }

  setPosts((prev) =>
    [...prev]
      .map((post) =>
        post.id === postId
          ? { ...post, is_pinned: !pinned }
          : post
      )
      .sort((a, b) => {
        if (a.is_pinned !== b.is_pinned)
          return Number(b.is_pinned) - Number(a.is_pinned);

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      })
  );

}


   return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white pt-24 md:pt-32 px-4 md:px-6"
      style={{
  backgroundImage: `url(${
    appearance.community_background ??
    "/backgrounds/home-v3.jpg"
  })`,
}}
    >
      <Navbar />

      <h1 className="text-3xl md:text-5xl font-bold text-center text-yellow-400 mb-4">
  Community
</h1>

<p className="text-center text-gray-300 mb-10 md:mb-16 px-2">
  Connect with fellow readers by sharing fan art, theories, questions, and discussions.
</p>

<div className="bg-black/50 rounded-3xl p-8 border border-yellow-500/20">

  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">

    <div>
      <h2 className="text-2xl font-bold text-yellow-400">
        Community Feed
      </h2>

      <p className="text-gray-300 mt-2">
        Share updates, fan art, theories, and discuss Alamatika.
      </p>
    </div>

    <div className="flex gap-3 flex-wrap">

  <Link href="/community/new">
    <button className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition">
      ➕ Create Post
    </button>
  </Link>

  <Link href="/community/myposts">
    <button className="px-6 py-3 bg-zinc-700 text-white rounded-xl font-bold hover:bg-zinc-600 transition">
      📄 My Posts
    </button>
  </Link>

</div>

  </div>

<div className="flex flex-wrap gap-3 mb-6">


  <button
    onClick={() => setSortMode("Newest")}
    className={`px-4 py-2 rounded-full text-sm md:text-base font-bold transition ${
      sortMode === "Newest"
        ? "bg-yellow-500 text-black"
        : "bg-zinc-800 hover:bg-zinc-700"
    }`}
  >
    🕒 Newest
  </button>

  <button
    onClick={() => setSortMode("Trending")}
    className={`px-5 py-2 rounded-full font-bold transition ${
      sortMode === "Trending"
        ? "bg-yellow-500 text-black"
        : "bg-zinc-800 hover:bg-zinc-700"
    }`}
  >
    🔥 Trending
  </button>


  {[
    "All",
    "Discussion",
    "Question",
    "Artworks",
  ].map((category) => (

    

    <button
      key={category}
      onClick={() => setSelectedCategory(category)}
      className={`px-5 py-2 rounded-full font-bold transition ${
        selectedCategory === category
          ? "bg-yellow-500 text-black"
          : "bg-zinc-800 hover:bg-zinc-700"
      }`}
    >
      {category}
    </button>

  ))}

</div>

     <input
  type="text"
  placeholder="🔍 Search posts..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full mb-6 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm md:text-base focus:border-yellow-500 outline-none transition"
/>

  <div className="space-y-6 max-w-4xl mx-auto">

    {posts.length === 0 && (
      <div className="text-gray-400">
        No community posts yet.
      </div>
    )}

    {posts
  
.filter((post) => {

  const query = search.toLowerCase();

  const matchesSearch =
    (post.title ?? "").toLowerCase().includes(query) ||
    (post.content ?? "").toLowerCase().includes(query) ||
    (post.username ?? "").toLowerCase().includes(query) ||
    (post.category ?? "").toLowerCase().includes(query);

  const matchesCategory =
    selectedCategory === "All" ||
    post.category === selectedCategory;

  return matchesSearch && matchesCategory;

})

.sort((a, b) => {

if (sortMode === "Trending") {

  if (a.is_pinned !== b.is_pinned)
    return Number(b.is_pinned) - Number(a.is_pinned);

  return (b.like_count ?? 0) - (a.like_count ?? 0);

}

if (a.is_pinned !== b.is_pinned)
  return Number(b.is_pinned) - Number(a.is_pinned);

return (
  new Date(b.created_at).getTime() -
  new Date(a.created_at).getTime()
);
})
  
.slice(0, visiblePosts)

.map((post) => (

  <div
    key={post.id}
    className="bg-zinc-900 rounded-2xl p-6 hover:border hover:border-yellow-500 transition"
  >

    <p className="text-yellow-400 font-semibold">
      {post.category}
    </p>

    <div className="flex items-center gap-3 flex-wrap">

  <Link href={`/profile/${post.user_id}`}>

    {post.avatar ? (

      <img
        src={post.avatar}
        alt={post.username}
        className="w-12 h-12 rounded-full object-cover object-center border border-yellow-500"
      />

    ) : (

      <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
        👤
      </div>

    )}

  </Link>

  <Link
    href={`/profile/${post.user_id}`}
    className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
  >
    {post.username}
  </Link>

</div>
      <h2 className="text-xl md:text-2xl font-bold break-words">

  {post.is_pinned && (
    <span className="text-yellow-400 mr-2">
      📌
    </span>
  )}

  {post.title}

</h2>

    

    <p className="text-gray-400 mt-2">
  📅 {new Date(post.created_at).toLocaleDateString()}
</p>

<div className="flex items-center gap-5 text-gray-400">
  <span>❤️ {post.like_count}</span>
  <span>💬 {post.comment_count ?? 0}</span>
</div>

{post.image && (
  <Link href={`/community/${post.id}`}>
    <div className="mt-4 mx-auto max-w-2xl bg-black rounded-2xl border border-zinc-700 overflow-hidden flex justify-center items-center hover:border-yellow-500 transition">
      <img
        src={post.image}
        alt={post.title}
        className="w-full max-h-[220px] md:max-h-[400px] object-contain"
      />
    </div>
  </Link>
)}


    {isAdmin && (

  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
  togglePin(post.id, post.is_pinned);
}}
    className="mt-3 text-yellow-400 hover:text-yellow-300 text-sm font-bold transition"
  >
    {post.is_pinned ? "📌 Unpin Post" : "📌 Pin Post"}
  </button>

)}

    <Link href={`/community/${post.id}`}>
  <p className="text-gray-300 mt-4 line-clamp-3 text-sm md:text-base max-w-2xl hover:text-yellow-300 transition">
    {post.content}
  </p>
</Link>

  </div>

))}

{visiblePosts < posts.length && (
  <div className="text-center py-10">
    <p className="text-gray-500">
      Scroll down to load more posts
    </p>

    <p className="text-yellow-500 text-sm mt-2">
      Showing {Math.min(visiblePosts, posts.length)} of {posts.length} posts
    </p>
  </div>
)}

  </div>    {/* space-y-6 */}
</div>      {/* bg-black/50 */}


    </main>


  );
}