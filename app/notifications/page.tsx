"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

type Notification = {
  id: number;
  user_id: string;
  actor_id: string;
  actor_username: string;
  post_id: number | null;
  type: string;
  message: string;
  created_at: string;
};

export default function NotificationsPage() {

    const [notifications, setNotifications] = useState<Notification[]>([]);
const [loading, setLoading] = useState(true);


async function deleteNotification(notificationId: number) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setNotifications((prev) =>
    prev.filter((n) => n.id !== notificationId)
  );
}

async function clearNotifications() {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const confirmClear = confirm(
    "Delete all notifications?"
  );

  if (!confirmClear) return;

  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  setNotifications([]);

}

useEffect(() => {
  
    const channel = supabase
  .channel("notifications-live")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "notifications",
    },
    () => {
      loadNotifications();
    }
  )
  .subscribe();

  async function loadNotifications() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

      

    setNotifications(data ?? []);
    setLoading(false);

  }

  loadNotifications();

  return () => {
  supabase.removeChannel(channel);
};

}, []);

if (loading) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      Loading...
    </main>
  );
}

return (
  <main className="min-h-screen bg-black text-white px-4 md:px-6">

    <Navbar />

    <section className="max-w-5xl mx-auto pt-24 md:pt-32">

      <h1 className="text-3xl md:text-5xl font-bold text-yellow-400 mb-8 md:mb-12">
        🔔 Notifications
      </h1>

      {notifications.length > 0 && (

      <button
         onClick={clearNotifications}
         className="w-full md:w-auto mb-8 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold transition"
         >
          🗑 Clear All Notifications
      </button>

        )}

      {notifications.length === 0 && (

         <div className="text-center py-16 text-gray-500">
  <div className="text-5xl mb-4">🔔</div>
  <p className="text-lg">You are all caught up!</p>
  <p className="text-sm mt-2">
    New likes, comments, and bookmarks will appear here.
  </p>
</div>

        )}

        <div className="space-y-5">

        {notifications.map((notification) => (

        <div

        key={notification.id}

        className="block bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 md:p-6 transition"

          >

    <p className="font-bold text-yellow-400 text-base md:text-lg">
      {notification.actor_username}
    </p>

      
      <Link
       href={
        notification.post_id
         ? `/community/${notification.post_id}`
         : `/profile/${notification.actor_id}`
    }
     className="block text-gray-300 mt-2 text-sm md:text-base leading-6 hover:text-yellow-400 transition"
  >
     {notification.message}
   </Link>


    <p className="text-gray-500 text-sm mt-4">
      {new Date(notification.created_at).toLocaleString("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
})}
    </p>

    <button
  onClick={() => {
    console.log("Delete clicked", notification.id);
    deleteNotification(notification.id);
  }}
>
  🗑 Delete
</button>

  </div>

))}

</div>


      
<footer className="mt-24 mb-10 text-center text-gray-600 text-sm">
  © Alamatika. All Rights Reserved.
</footer>

</section>

</main>
);

}