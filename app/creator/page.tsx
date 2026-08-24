"use client";

import CreatorGuard from "../../components/CreatorGuard";
import Navbar from "../../components/navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import CreatorChatPopup from "../../components/CreatorChatPopup";

type Chapter = {
  id: number;
  chapter: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  page_images: string[] | null;
  published: boolean;
  pages: number;
};

export default function CreatorStudio() {
  const [totalChapters, setTotalChapters] = useState(0);
  const [publishedChapters, setPublishedChapters] = useState(0);
  const [draftChapters, setDraftChapters] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [recentChapters, setRecentChapters] = useState<Chapter[]>([]);
  const [publishingQueue, setPublishingQueue] = useState<Chapter[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [stats, setStats] = useState({
    users: 0,
    chapters: 0,
    posts: 0,
    comments: 0,
    likes: 0,
    reports: 0,
    bookmarks: 0,
    revenue: 0,
  });

  const [bestSelling, setBestSelling] = useState<
    {
      chapter_id: number;
      chapter: number;
      title: string;
      sales: number;
    }[]
  >([]);



useEffect(() => {


  async function loadStats() {
    const { data, error } = await supabase
  .from("chapters")
  .select("*")
  .order("chapter", { ascending: false });

    if (error || !data) return;

    setTotalChapters(data.length);

    setPublishedChapters(
      data.filter(chapter => chapter.published).length
    );

    setDraftChapters(
      data.filter(chapter => !chapter.published).length
    );

    const pages = data.reduce(
      (sum, chapter) => sum + (chapter.pages ?? 0),
      0
    );

    setTotalPages(pages);

    setRecentChapters(data.slice(0, 5));
  
  setPublishingQueue(
  data.filter(
    chapter =>
      !chapter.published ||
      !chapter.cover_image ||
      !chapter.description ||
      (chapter.page_images?.length ?? 0) === 0
  )
);

const [
  users,
  posts,
  comments,
  likes,
  reports,
  bookmarks,
  creatorMessages,
] = await Promise.all([

  supabase
    .from("profiles")
    .select("*", {
      count: "exact",
      head: true,
    }),

  supabase
    .from("community")
    .select("*", {
      count: "exact",
      head: true,
    }),

  supabase
    .from("comments")
    .select("*", {
      count: "exact",
      head: true,
    }),

  supabase
    .from("community_likes")
    .select("*", {
      count: "exact",
      head: true,
    }),

  supabase
  .from("reports")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("status", "pending"),

  supabase
    .from("bookmarks")
    .select("*", {
      count: "exact",
      head: true,
    }),

    supabase
  .from("creator_messages")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("status", "pending"),

]);

const { data: purchaseData } = await supabase
  .from("credit_purchases")
  .select("*")
  .eq("status", "paid");

console.log("PURCHASE DATA:", purchaseData);

  const { data: chaptersData } = await supabase
  .from("chapters")
  .select("id, chapter, title");

const chapterMap = new Map(
  chaptersData?.map((c) => [
    c.id,
    {
      chapter: c.chapter,
      title: c.title,
    },
  ]) ?? []
);

const totalRevenue =
  purchaseData?.reduce(
    (sum, purchase) => sum + (purchase.peso_amount ?? 0),
    0
  ) ?? 0;

const salesMap = new Map<
  number,
  {
    chapter_id: number;
    chapter: number;
    title: string;
    sales: number;
  }
>();

purchaseData?.forEach((purchase) => {

  const chapterId = purchase.chapter_id;

  const chapterInfo = chapterMap.get(chapterId);

  if (!chapterInfo) return;

  if (!salesMap.has(chapterId)) {
    salesMap.set(chapterId, {
      chapter_id: chapterId,
      chapter: chapterInfo.chapter,
      title: chapterInfo.title,
      sales: 0,
    });
  }

  salesMap.get(chapterId)!.sales++;
});

const topSelling = [...salesMap.values()]
  .sort((a, b) => b.sales - a.sales)
  .slice(0, 5);

setBestSelling(topSelling);

setStats({
  users: users.count ?? 0,
  chapters: data.length,
  posts: posts.count ?? 0,
  comments: comments.count ?? 0,
  likes: likes.count ?? 0,
  reports: reports.count ?? 0,
  bookmarks: bookmarks.count ?? 0,
  revenue: totalRevenue,
  
});

setUnreadMessages(
  creatorMessages.count ?? 0
);
  
  }


  loadStats();
  
}, []);

useEffect(() => {
  const channel = supabase
    .channel("creator-payments")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "credit_purchases",
      },
      () => {
        window.location.reload();
      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "manual_payments",
      },
      () => {
        window.location.reload();
      }
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

useEffect(() => {

  const channel = supabase
    .channel("creator-inbox")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "creator_messages",
      },
      async () => {

        const { count } = await supabase
          .from("creator_messages")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "pending");

        setUnreadMessages(count ?? 0);

      }
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };

}, []);

useEffect(() => {
  const channel = supabase
    .channel("creator-reports")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reports",
      },
      async () => {
        const { count } = await supabase
          .from("reports")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "pending");

        setStats((previous) => ({
          ...previous,
          reports: count ?? 0,
        }));
      }
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  return (
  <CreatorGuard>
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-6xl mx-auto pt-28 sm:pt-32 px-4 sm:px-6">

        {/* Header */}

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-12">

          <div>

            <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
              Creator Studio
            </h1>

            <p className="text-gray-400 mt-2">
              Manage every part of ALAMATIKA.
            </p>

          </div>

          <button
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition"
          >
            🚪 Logout
          </button>

        </div>


        {/* ===== Statistics ===== */}

<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">

  <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">📚</div>
    <p className="text-xl font-bold text-yellow-400">{totalChapters}</p>
    <p className="text-xs text-gray-400">Chapters</p>
  </div>

  <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">🟢</div>
    <p className="text-xl font-bold text-green-400">{publishedChapters}</p>
    <p className="text-xs text-gray-400">Published</p>
  </div>

  <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">📝</div>
    <p className="text-xl font-bold text-yellow-400">{draftChapters}</p>
    <p className="text-xs text-gray-400">Drafts</p>
  </div>

  <div className="bg-zinc-900 border border-blue-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">📄</div>
    <p className="text-xl font-bold text-blue-400">{totalPages}</p>
    <p className="text-xs text-gray-400">Pages</p>
  </div>

  <div className="bg-zinc-900 border border-blue-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">👥</div>
    <p className="text-xl font-bold text-blue-400">{stats.users}</p>
    <p className="text-xs text-gray-400">Users</p>
  </div>

  <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">💬</div>
    <p className="text-xl font-bold text-purple-400">{stats.posts}</p>
    <p className="text-xs text-gray-400">Posts</p>
  </div>

  <div className="bg-zinc-900 border border-pink-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">❤️</div>
    <p className="text-xl font-bold text-pink-400">{stats.likes}</p>
    <p className="text-xs text-gray-400">Likes</p>
  </div>

  <div className="bg-zinc-900 border border-cyan-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">📝</div>
    <p className="text-xl font-bold text-cyan-400">{stats.comments}</p>
    <p className="text-xs text-gray-400">Comments</p>
  </div>

  <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">🔖</div>
    <p className="text-xl font-bold text-green-400">{stats.bookmarks}</p>
    <p className="text-xs text-gray-400">Bookmarks</p>
  </div>

  <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">💰</div>
    <p className="text-xl font-bold text-emerald-400">
      ₱{stats.revenue.toLocaleString()}
    </p>
    <p className="text-xs text-gray-400">Revenue</p>
  </div>

  <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-3 text-center">
    <div className="text-xl">🚩</div>
    <p className="text-xl font-bold text-red-400">{stats.reports}</p>
    <p className="text-xs text-gray-400">Reports</p>
  </div>

</div>

{/* ===== Best Selling Chapters ===== */}

<div className="mt-8 mb-8">

  <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-3">
    🏆 Best Selling Chapters
  </h2>

  {bestSelling.length === 0 ? (

    <p className="text-gray-500 text-sm">
      No chapter sales yet.
    </p>

  ) : (

    <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">

      {bestSelling.map((item, index) => (

        <div
          key={item.chapter_id}
          className="flex items-center justify-between px-3 py-2.5"
        >

          <div className="flex items-center gap-2 min-w-0">

            <span className="text-base w-6 text-center shrink-0">
              {index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : `${index + 1}.`}
            </span>

            <div className="min-w-0">

              <p className="font-semibold text-sm sm:text-base truncate">
                Chapter {item.chapter}
              </p>

              <p className="text-xs text-gray-500 truncate">
                {item.title}
              </p>

            </div>

          </div>

          <span className="text-yellow-400 font-bold text-xs sm:text-sm whitespace-nowrap ml-3">
            {item.sales} {item.sales === 1 ? "sale" : "sales"}
          </span>

        </div>

      ))}

    </div>

  )}

</div>

   
{/* ===== Quick Actions ===== */}

<div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 mb-12">

  <h2 className="text-2xl font-bold text-yellow-400 mb-6">
    ⚡ Quick Actions
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

    <Link
  href="/creator/stories"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  📚 Stories
</Link>

<Link
  href="/creator/chapters"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  📖 Chapters
</Link>

<Link
  href="/creator/stories"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  ➕ Publish Chapter
</Link>

    <Link href="/creator/characters" className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition">
      👥 Characters
    </Link>

    <Link href="/creator/news" className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition">
      📰 News
    </Link>

    <Link href="/creator/lore" className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition">
      📜 Lore
    </Link>

    <Link href="/creator/assets" className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition">
      🗂 Assets
    </Link>

    <Link href="/creator/settings" className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition">
      ⚙ Settings
    </Link>

    <Link
  href="/creator/income"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  💰 Income Report
</Link>

<Link
  href="/creator/payments"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  💳 Manual Payments
</Link>

<Link
  href="/creator/payments/settings"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  ⚙️ Payment Settings
</Link>

    <Link
      href="/creator/appearance"
      className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
      >
      🎨 Appearance
    </Link>

    <Link
  href="/creator/readers"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  👥 Reader Accounts
</Link>

    <Link
  href="/creator/users"
  className="bg-zinc-800 rounded-xl p-5 text-center hover:bg-zinc-700 transition"
>
  👥 Users
</Link>


<Link href="/creator/site-content">
  <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl p-6 transition">
    📝 Site Content
  </button>
</Link>


    <Link href="/creator/reports">
     <button className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-4 font-bold transition">
      🚩 Reports
     </button>
   </Link>

   <Link
  href="/creator/moderation"
  className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 hover:border-yellow-500 transition"
>
  <div className="text-3xl mb-3">
    🛡️
  </div>

  <h2 className="text-xl font-bold text-yellow-400">
    Moderation History
  </h2>

  <p className="text-gray-400 mt-2">
    Review bans, unbans, deleted posts, and deleted comments.
  </p>
</Link>

  </div>

</div>


{/* ===== Recent Chapters ===== */}

<div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 mb-12">

  <h2 className="text-2xl font-bold text-yellow-400 mb-6">
    🕒 Recent Chapters
  </h2>

  <div className="space-y-4">

    {recentChapters.length === 0 && (
      <p className="text-gray-400">No chapters yet.</p>
    )}

    {recentChapters.map((chapter) => (

      <Link
        key={chapter.id}
        href={`/creator/chapters/${chapter.id}`}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-zinc-800 pb-3 hover:bg-zinc-800 rounded-lg px-3 py-3 transition"
      >

        <div>

          <p className="font-semibold text-lg">
            Chapter {chapter.chapter}
          </p>

          <p className="text-gray-400">
            {chapter.title}
          </p>

        </div>

        <span
  className={`self-start sm:self-auto px-3 py-1 rounded-full text-sm font-bold ${
            chapter.published
              ? "bg-green-600"
              : "bg-yellow-600"
          }`}
        >
          {chapter.published ? "Published" : "Draft"}
        </span>

      </Link>

    ))}

  </div>

</div>



{/* ===== Publishing Queue ===== */}

<div className="bg-zinc-900 border border-red-500 rounded-2xl p-8 mb-12">

  <h2 className="text-2xl font-bold text-red-400 mb-6">
    ⚠ Publishing Queue
  </h2>

  {publishingQueue.length === 0 ? (

    <p className="text-green-400 font-semibold">
      🎉 Everything is ready to publish!
    </p>

  ) : (

    <div className="space-y-4">

      {publishingQueue.map((chapter) => (

        <Link
          key={chapter.id}
          href={`/creator/chapters/${chapter.id}`}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-zinc-800 pb-3 hover:bg-zinc-800 rounded-lg px-3 py-3 transition"
        >

          <div>

            <p className="font-semibold">
              Chapter {chapter.chapter}
            </p>

            <p className="text-gray-400">
              {chapter.title || "Untitled Chapter"}
            </p>

          </div>

          <div className="text-left sm:text-right text-sm">

            {!chapter.published && (
              <p className="text-yellow-400">🟡 Draft</p>
            )}

            {!chapter.cover_image && (
              <p className="text-red-400">❌ No Cover</p>
            )}

            {!chapter.description && (
              <p className="text-red-400">❌ No Description</p>
            )}

            {(chapter.page_images?.length ?? 0) === 0 && (
              <p className="text-red-400">❌ No Pages</p>
            )}

          </div>

        </Link>

      ))}

    </div>

  )}

  

</div>

{/* ===== Main Menu ===== */}


</section>
      <footer className="mt-24 mb-10 text-black-600 text-sm text-center hover:text-black transition">
        © Alamatika. All Rights Reserved.
        <br />
        Version 1.0.0
      </footer>

      <CreatorChatPopup />

    </main>

    

    </CreatorGuard>
  );
}
