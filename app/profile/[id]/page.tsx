"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../components/navbar";
import { supabase } from "../../../lib/supabaseClient";

type Profile = {
  id: string;
  username: string;
  bio: string;
  avatar: string;
  created_at: string;
};

type CommunityPost = {
  id: number;
  title: string;
  created_at: string;
};

export default function PublicProfile() {

    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [currentUserId, setCurrentUserId] = useState("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState<"posts" | "bookmarks">("posts");
    const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<CommunityPost[]>([]);
    

    const { id } = useParams();

    const [profile, setProfile] = useState<Profile | null>(null);

  async function toggleFollow() {

     if (!currentUserId) return;

     if (currentUserId === String(id)) return; // Can't follow yourself

     if (isFollowing) {

        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", String(id));

         setIsFollowing(false);
         setFollowers((f) => f - 1);

       } else {

        await supabase
          .from("followers")
          .insert({
          follower_id: currentUserId,
          following_id: id,
            });

         setIsFollowing(true);
         setFollowers((f) => f + 1);

        }

     }
  
      useEffect(() => {

    async function loadProfile() {

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setProfile(data);
      }

      const { data: posts } = await supabase
        .from("community")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

        setUserPosts(posts ?? []);

      const { data: bookmarkRows } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", id);

       if (bookmarkRows && bookmarkRows.length > 0) {

      const postIds = bookmarkRows.map((b) => b.post_id);

      const { data: bookmarked } = await supabase
        .from("community")
        .select("id, title, created_at")
        .in("id", postIds);

        setBookmarkedPosts(bookmarked ?? []);

      } else {

        setBookmarkedPosts([]);

      }


       const { count: followersCount } = await supabase
         .from("followers")
         .select("*", { count: "exact", head: true })
         .eq("following_id", id);

         setFollowers(followersCount ?? 0);

      const { count: followingCount } = await supabase
         .from("followers")
         .select("*", { count: "exact", head: true })
         .eq("follower_id", id);

         setFollowing(followingCount ?? 0);

      const { data: userData } = await supabase.auth.getUser();

          if (userData.user) {

         setCurrentUserId(userData.user.id);

      const { data: existingFollow } = await supabase
         .from("followers")
         .select("id")
         .eq("follower_id", userData.user.id)
         .eq("following_id", id)
         .maybeSingle();

         setIsFollowing(!!existingFollow);

        }

     }

     if (id) {
      loadProfile();
     }

     }, [id]);

     if (!profile) {
      return (
         <main className="min-h-screen bg-black text-white flex items-center justify-center">
           Loading Profile...
         </main>
         );

      }

      return (

         <main className="min-h-screen bg-black text-white">

         <Navbar />

         <section className="max-w-3xl mx-auto pt-32 px-6">

         <div className="bg-zinc-900 rounded-3xl p-10">

          {profile.avatar ? (

            <img
              src={profile.avatar}
              alt={profile.username}
              className="w-40 h-40 rounded-full object-cover border-4 border-yellow-500 mx-auto"
            />

          ) : (

            <div className="w-40 h-40 rounded-full bg-zinc-800 flex items-center justify-center text-6xl mx-auto">
              👤
            </div>

          )}

          <h1 className="text-4xl font-bold text-center text-yellow-400 mt-8">
            {profile.username}
          </h1>

          <p className="text-center text-gray-400 mt-6 whitespace-pre-wrap">
            {profile.bio || "No bio yet."}
          </p>

          <p className="text-center text-gray-500 mt-4">
            📅 Member since{" "}
            {new Date(profile.created_at).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
            })}
           </p>

          <div className="flex justify-center gap-16 mt-10">

         <Link
           href={`/profile/${id}/followers`}
           className="text-center hover:opacity-80 transition"
          >
          <p className="text-3xl font-bold text-yellow-400">
           {followers}
          </p>

          <p className="text-gray-400">
           Followers
          </p>
         </Link>

         <Link
          href={`/profile/${id}/following`}
          className="text-center hover:opacity-80 transition"
           >
          <p className="text-3xl font-bold text-yellow-400">
          {following}
          </p>

          <p className="text-gray-400">
           Following
           </p>
          </Link>
          

         </div>

         

          <div className="mt-10 border-t border-zinc-700 pt-6">

          <div className="flex justify-center gap-4">

    <button
      onClick={() => setActiveTab("posts")}
      className={`px-6 py-3 rounded-xl font-bold transition ${
        activeTab === "posts"
          ? "bg-yellow-500 text-black"
          : "bg-zinc-800 hover:bg-zinc-700 text-white"
      }`}
    >
      📝 Posts ({userPosts.length})
    </button>

    <button
      onClick={() => setActiveTab("bookmarks")}
      className={`px-6 py-3 rounded-xl font-bold transition ${
        activeTab === "bookmarks"
          ? "bg-yellow-500 text-black"
          : "bg-zinc-800 hover:bg-zinc-700 text-white"
      }`}
    >
      📚 Bookmarks ({bookmarkedPosts.length})
    </button>

  </div>

  <div className="mt-8">

  {activeTab === "posts" && (

    <div className="space-y-4">

      {userPosts.length === 0 ? (

        <p className="text-center text-gray-500">
          No posts yet.
        </p>

      ) : (

        userPosts.map((post) => (

          <Link
            key={post.id}
            href={`/community/${post.id}`}
            className="block bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-5 transition"
          >

            <h3 className="text-xl font-bold text-yellow-400">
              {post.title}
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              {new Date(post.created_at).toLocaleDateString()}
            </p>

          </Link>

        ))

      )}

    </div>

  )}

  {activeTab === "bookmarks" && (

<div className="space-y-4">

  {bookmarkedPosts.length === 0 ? (

    <p className="text-center text-gray-500">
      No bookmarks yet.
    </p>

  ) : (

    bookmarkedPosts.map((post) => (

      <Link
        key={post.id}
        href={`/community/${post.id}`}
        className="block bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-5 transition"
      >

        <h3 className="text-xl font-bold text-yellow-400">
          {post.title}
        </h3>

        <p className="text-gray-500 text-sm mt-1">
          {new Date(post.created_at).toLocaleDateString()}
        </p>

      </Link>

    ))

  )}

</div>

)}

</div>

</div>
          {currentUserId && currentUserId !== String(id) && (

          <div className="mt-10 flex justify-center">         

         <button
          onClick={toggleFollow}
          className={`px-10 py-4 rounded-xl font-bold transition ${
             isFollowing
              ? "bg-zinc-700 hover:bg-zinc-600 text-white"
              : "bg-yellow-500 hover:bg-yellow-400 text-black"
          }`}
          >
           {isFollowing ? "✓ Following" : "+ Follow"}
         </button>

         </div>

         )}

         </div>

         </section>

      </main>

    );

}