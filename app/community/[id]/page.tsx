"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import Link from "next/link";

type CommunityPost = {
  id: number;
  user_id: string;
  username: string;
  title: string;
  content: string;
  image: string;
  created_at: string;
  category: string;
  like_count: number;
  avatar?: string;
};

type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  avatar?: string;
  edited?: boolean;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<CommunityPost | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<number | null>(null);

  const [bookmarked, setBookmarked] = useState(false);

 async function postComment() {

  if (!currentUser) return;

  if (!newComment.trim()) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", currentUser.id)
    .single();

  const { error } = await supabase
    .from("comments")
    .insert({
      post_id: Number(id),
      user_id: currentUser.id,
      username: profile?.username,
      content: newComment,
    });


 if (error) {
    alert(error.message);
    return;
  }


if (currentUser.id !== post?.user_id) {
  const { error: notificationError } = await supabase
  .from("notifications")
  .insert({
    user_id: post?.user_id,
    actor_id: currentUser.id,
    actor_username: profile?.username,
    type: "comment", // or "like"
    post_id: Number(id),
    message: `${profile?.username} commented on your post.`,
  });

if (notificationError) {
  console.error(notificationError);
}

}

  const { data: commentsData } = await supabase
  .from("comments")
  .select("*")
  .eq("post_id", Number(id))
  .order("created_at", { ascending: true });

const commentUserIds = [
  ...new Set(commentsData?.map(comment => comment.user_id) ?? []),
];

const { data: profileData } = await supabase
  .from("profiles")
  .select("id, avatar")
  .in("id", commentUserIds);

const avatarMap = new Map(
  profileData?.map(profile => [profile.id, profile.avatar]) ?? []
);

const formattedComments =
  commentsData?.map(comment => ({
    ...comment,
    avatar: avatarMap.get(comment.user_id) ?? "",
  })) ?? [];

setComments(formattedComments);
  setNewComment("");

}

async function toggleLike() {

  if (!currentUser) return;

  const { data: profile } = await supabase
  .from("profiles")
  .select("username")
  .eq("id", currentUser.id)
  .single();

  if (liked) {

    await supabase
      .from("community_likes")
      .delete()
      .eq("post_id", Number(id))
      .eq("user_id", currentUser.id);

    setLiked(false);
    setLikes((l) => l - 1);

    await supabase.rpc("decrement_like_count", {
  post_id_input: Number(id),
});

  } else {

    await supabase
      .from("community_likes")
      .insert({
        post_id: Number(id),
        user_id: currentUser.id,
      });

      await supabase.rpc("increment_like_count", {
        post_id_input: Number(id),
      });

      if (currentUser.id !== post?.user_id) {

      
        const { error: notificationError } = await supabase
       .from("notifications")
       .insert({
         user_id: post?.user_id,
         actor_id: currentUser.id,
         actor_username: profile?.username,
         type: "like",
         post_id: Number(id),
         message: `${profile?.username} liked your post.`,
       });

if (notificationError) {
  console.error(notificationError);
}

}

    setLiked(true);
    setLikes((l) => l + 1);

  }

} // <-- CLOSE toggleLike HERE

async function toggleBookmark() {

  if (!currentUser) return;

  if (bookmarked) {

    await supabase
      .from("bookmarks")
      .delete()
      .eq("post_id", Number(id))
      .eq("user_id", currentUser.id);

    setBookmarked(false);

    await supabase.rpc("decrement_bookmark_count", {
  post_id_input: Number(id),
});

  } else {

    await supabase
      .from("bookmarks")
      .insert({
        post_id: Number(id),
        user_id: currentUser.id,
      });

    setBookmarked(true);

    await supabase.rpc("increment_bookmark_count", {
  post_id_input: Number(id),
});

  }

}


async function reportPost() {

  if (!currentUser) return;

  if (currentUser.id === post?.user_id) {
  alert("You can't report your own post.");
  return;
}

  const reason = prompt(
    "Why are you reporting this post?\n\nExamples:\nSpam\nHarassment\nNSFW\nCopyright"
  );

  if (!reason) return;

  console.log("POST ID:", id);
console.log("NUMBER(ID):", Number(id));

const { data, error } = await supabase
  .from("reports")
  .insert({
    reporter_id: currentUser.id,
    post_id: Number(id),
    reason,
  })
  .select();

console.log("INSERTED REPORT:", JSON.stringify(data, null, 2));
console.log("ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  alert("✅ Report submitted. Thank you!");

}

async function reportComment(
  commentId: number,
  ownerId: string
) {
  if (!currentUser) return;

  if (currentUser.id === ownerId) {
    alert("You can't report your own comment.");
    return;
  }

  const reason = prompt(
    "Why are you reporting this comment?\n\nExamples:\nSpam\nHarassment\nNSFW\nCopyright"
  );

  if (!reason) return;

  const { error } = await supabase
    .from("reports")
    .insert({
      reporter_id: currentUser.id,
      comment_id: commentId,
      reason,
    });

  if (error) {
    alert(error.message);
    return;
  }

  alert("✅ Comment reported.");
}


async function deletePost() {

  if (!currentUser) return;

  const confirmDelete = confirm(
    "Are you sure you want to delete this post?"
  );

  if (!confirmDelete) return;

  await supabase
  .from("comments")
  .delete()
  .eq("post_id", Number(id));

await supabase
  .from("community_likes")
  .delete()
  .eq("post_id", Number(id));

const { error } = await supabase
  .from("community")
  .delete()
  .eq("id", Number(id))
  .eq("user_id", currentUser.id);

if (error) {
  alert(error.message);
  return;
}

alert("Post deleted!");

router.push("/community");
}

async function deleteComment(commentId: number) {
  if (!currentUser) return;

  const confirmDelete = confirm(
    "Are you sure you want to delete this comment?"
  );

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  setComments((prev) =>
    prev.filter((comment) => comment.id !== commentId)
  );
}

async function saveComment(commentId: number) {
  if (!editingCommentText.trim()) return;

  const { error } = await supabase
    .from("comments")
    .update({
      content: editingCommentText,
      edited: true,
    })
    .eq("id", commentId)
    .eq("user_id", currentUser?.id);

  if (error) {
    alert(error.message);
    return;
  }

  setComments((prev) =>
    prev.map((comment) =>
      comment.id === commentId
        ? { ...comment, content: editingCommentText }
        : comment
    )
  );

  setEditingCommentId(null);
  setEditingCommentText("");
}



useEffect(() => {
    async function loadPost() {

      const { data, error } = await supabase
        .from("community")
        .select("*")
        .eq("id", Number (id))
        .single();

      if (data) {

  const { data: profileData } = await supabase
    .from("profiles")
    .select("avatar")
    .eq("id", data.user_id)
    .single();

  setPost({
    ...data,
    avatar: profileData?.avatar ?? "",
  });

}

      const { data: userData } = await supabase.auth.getUser();
setCurrentUser(userData.user);

const { data: commentsData } = await supabase
  .from("comments")
  .select("*")
  .eq("post_id", Number(id))
  .order("created_at", { ascending: true });

const commentUserIds = [
  ...new Set(commentsData?.map(comment => comment.user_id) ?? []),
];

const { data: profileData } = await supabase
  .from("profiles")
  .select("id, avatar")
  .in("id", commentUserIds);

const avatarMap = new Map(
  profileData?.map(profile => [profile.id, profile.avatar]) ?? []
);

const formattedComments =
  commentsData?.map(comment => ({
    ...comment,
    avatar: avatarMap.get(comment.user_id) ?? "",
  })) ?? [];

setComments(formattedComments);

const { count } = await supabase
  .from("community_likes")
  .select("*", { count: "exact", head: true })
  .eq("post_id", Number(id));

setLikes(count ?? 0);

if (userData.user) {

  const { data: existingLike } = await supabase
    .from("community_likes")
    .select("id")
    .eq("post_id", Number(id))
    .eq("user_id", userData.user.id)
    .maybeSingle();

  setLiked(!!existingLike);

  const { data: existingBookmark } = await supabase
  .from("bookmarks")
  .select("id")
  .eq("post_id", Number(id))
  .eq("user_id", userData.user.id)
  .maybeSingle();

setBookmarked(!!existingBookmark);

}

      setLoading(false);

}

if (id) {
  loadPost();
}

const likesChannel = supabase
  .channel(`likes-${id}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "community_likes",
      filter: `post_id=eq.${id}`,
    },
    async () => {

      const { count } = await supabase
        .from("community_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", Number(id));

      setLikes(count ?? 0);

    }
  )
  .subscribe();

const commentsChannel = supabase
  .channel(`comments-${id}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "comments",
      filter: `post_id=eq.${id}`,
    },
    async () => {

      const { data } = await supabase
  .from("comments")
  .select("*")
  .eq("post_id", Number(id))
  .order("created_at", { ascending: true });

const commentUserIds = [
  ...new Set(data?.map(comment => comment.user_id) ?? []),
];

const { data: profileData } = await supabase
  .from("profiles")
  .select("id, avatar")
  .in("id", commentUserIds);

const avatarMap = new Map(
  profileData?.map(profile => [profile.id, profile.avatar]) ?? []
);

const formattedComments =
  data?.map(comment => ({
    ...comment,
    avatar: avatarMap.get(comment.user_id) ?? "",
  })) ?? [];

setComments(formattedComments);

    }
  )
  .subscribe();


return () => {
  supabase.removeChannel(likesChannel);
  supabase.removeChannel(commentsChannel);
};

}, [id]);


  if (loading) {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-32 text-center">
        Loading Post...
      </div>
    </main>
  );
}

  if (!post) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Post not found.
      </main>
    );
  }

  return (


    
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-5xl mx-auto pt-28 md:pt-32 px-4 md:px-6">

        <Link
          href="/community"
          className="text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to Community
        </Link>

        {/* Comments */}



        <div className="mt-10">

          {post.image && (

            <img
              src={post.image}
              alt={post.title || "Post image"}
              className="w-full max-h-[500px] md:max-h-none object-contain rounded-3xl border border-yellow-500"
            />

          )}


          <div className="flex items-center gap-3">

  <Link href={`/profile/${post.user_id}`}>

    {post.avatar ? (

      <img
        src={post.avatar}
        alt={post.username}
        className="w-14 h-14 rounded-full object-cover object-center border border-yellow-500"
      />

    ) : (

      <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center">
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

          <h1 className="text-3xl md:text-5xl font-bold mt-3 break-words">
  {post.title}
</h1>

<div className="mt-5 space-y-2">


  <p className="text-gray-500">
    📅 {formatDate(post.created_at)}
  </p>

  <p className="text-yellow-400 uppercase tracking-widest">
    🏷️ {post.category}
  </p>

</div>

          <div className="mt-8 md:mt-10 text-base md:text-lg leading-7 md:leading-9 whitespace-pre-wrap text-gray-300">
            {post.content}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">

  <button
    onClick={toggleLike}
    className={`px-4 py-3 rounded-xl font-bold transition ${
      liked
        ? "bg-red-500 hover:bg-red-400 text-white"
        : "bg-yellow-500 hover:bg-yellow-400 text-black"
    }`}
  >
    {liked ? "❤️ Liked" : "🤍 Like"}
  </button>

  <span className="text-gray-400 font-semibold px-1">
    ❤️ {likes}
  </span>

  <button
    onClick={toggleBookmark}
    className={`px-4 py-3 rounded-xl font-bold transition ${
      bookmarked
        ? "bg-blue-600 hover:bg-blue-500 text-white"
        : "bg-zinc-700 hover:bg-zinc-600 text-white"
    }`}
  >
    {bookmarked ? "📖 Saved" : "🔖 Save"}
  </button>

  <div className="relative">

  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();

      setOpenMenuId(
        openMenuId === post.id
          ? null
          : post.id
      );
    }}
    className="w-11 h-11 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center font-bold transition"
    aria-label="Post options"
  >
    ⋮
  </button>

  {openMenuId === post.id && (
    <div
      className="absolute left-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-30"
      onClick={(e) => e.stopPropagation()}
    >

      {/* Report */}
      {currentUser?.id !== post.user_id && (
        <button
          onClick={() => {
            setOpenMenuId(null);
            reportPost();
          }}
          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition"
        >
          🚩 Report Post
        </button>
      )}

      {/* Owner options */}
      {currentUser?.id === post.user_id && (
        <>
          <Link
            href={`/community/${post.id}/edit`}
            onClick={() => setOpenMenuId(null)}
            className="block px-4 py-3 text-sm hover:bg-zinc-700 transition"
          >
            ✏️ Edit Post
          </Link>

          <button
            onClick={() => {
              setOpenMenuId(null);
              deletePost();
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition"
          >
            🗑️ Delete Post
          </button>
        </>
      )}

    </div>
  )}

</div>

  

</div>

          <div className="mt-20">

  <h2 className="text-3xl font-bold text-yellow-400 mb-8">
    💬 Comments
  </h2>

  <div className="space-y-6">

    {comments.length === 0 && (

      <div className="text-gray-500">
        No comments yet.
      </div>

    )}

    {comments.map((comment) => (

  <div
    key={comment.id}
    className="relative bg-zinc-900 rounded-2xl p-6"
  >

    {/* Comment Menu */}
    <div className="absolute top-4 right-4">

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          setOpenCommentMenuId(
            openCommentMenuId === comment.id
              ? null
              : comment.id
          );
        }}
        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-zinc-800 hover:text-white transition"
        aria-label="Comment options"
      >
        ⋮
      </button>

      {openCommentMenuId === comment.id && (
        <div
          className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-30"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Owner options */}
          {currentUser?.id === comment.user_id && (
            <>
              <button
                onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditingCommentText(comment.content);
                  setOpenCommentMenuId(null);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition"
              >
                ✏️ Edit Comment
              </button>

              <button
                onClick={() => {
                  setOpenCommentMenuId(null);
                  deleteComment(comment.id);
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition"
              >
                🗑️ Delete Comment
              </button>
            </>
          )}

          {/* Report option */}
          {currentUser && currentUser.id !== comment.user_id && (
            <button
              onClick={() => {
                setOpenCommentMenuId(null);
                reportComment(
                  comment.id,
                  comment.user_id
                );
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition"
            >
              🚩 Report Comment
            </button>
          )}

        </div>
      )}

    </div>

    {/* Comment User */}

    <div className="flex items-center gap-3">

      <Link href={`/profile/${comment.user_id}`}>

        {comment.avatar ? (

          <img
            src={comment.avatar}
            alt={comment.username}
            className="w-12 h-12 rounded-full object-cover object-center border border-yellow-500"
          />

        ) : (

          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
            👤
          </div>

        )}

      </Link>

      <div>

        <Link
          href={`/profile/${comment.user_id}`}
          className="font-bold text-yellow-400 hover:text-yellow-300 transition"
        >
          {comment.username}
        </Link>

      </div>

    </div>

    {/* Comment Date */}

    <p className="text-gray-500 text-sm mt-1">

      {formatDate(comment.created_at)}

      {comment.edited && (
        <span className="ml-2 text-gray-400">
          • Edited
        </span>
      )}

    </p>

    {/* Comment Content */}

    {editingCommentId === comment.id ? (

      <textarea
        value={editingCommentText}
        onChange={(e) =>
          setEditingCommentText(e.target.value)
        }
        className="w-full mt-4 rounded-xl bg-zinc-800 border border-zinc-700 p-3"
        rows={3}
      />

    ) : (

      <p className="mt-4 whitespace-pre-wrap text-gray-300">
        {comment.content}
      </p>

    )}

    {/* Edit Mode Buttons */}

    {editingCommentId === comment.id && (
      <div className="flex gap-4 mt-3">

        <button
          onClick={() => saveComment(comment.id)}
          className="text-green-400 hover:text-green-300 text-sm font-bold"
        >
          💾 Save
        </button>

        <button
          onClick={() => {
            setEditingCommentId(null);
            setEditingCommentText("");
          }}
          className="text-gray-400 hover:text-gray-300 text-sm font-bold"
        >
          ❌ Cancel
        </button>

      </div>
    )}

  </div>

))}

  </div>

</div>

{currentUser ? (

  <div className="mt-10 space-y-4">

    <textarea
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="Write a comment..."
      rows={4}
      className="w-full rounded-2xl bg-zinc-900 border border-zinc-700 p-4"
    />

    <button
      onClick={postComment}
      className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition"
    >
      🚀 Post Comment
    </button>

  </div>

) : (

  <div className="mt-8 text-gray-500">

    Please{" "}
    <Link href="/login" className="text-yellow-400">
      login
    </Link>{" "}
    to comment.

  </div>

)}
        

        </div>


        <Link
          href="/community"
          className="text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to Community
        </Link>

<footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

      </section>

    </main>
  );
}