"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import ChatPopup from "./ChatPopup";


export default function Navbar() {
  async function logout() {
  await supabase.auth.signOut();
  router.push("/");
}

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
const aboutMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [username, setUsername] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);


useEffect(() => {
  async function loadUnread() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { count } = await supabase
      .from("notifications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotificationCount(count ?? 0);
  }

  loadUnread();
}, []);

useEffect(() => {
  const channel = supabase
    .channel("notification-badge")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
      },
      async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { count } = await supabase
          .from("notifications")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id)
          .eq("is_read", false);

        setNotificationCount(count ?? 0);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);


useEffect(() => {

   async function getUser() {
     const { data } = await supabase.auth.getUser();
     setUser(data.user);

     if (data.user) {

  if (data.user) {
  const { data: profile } = await supabase
  .from("profiles")
  .select("avatar, username")
  .eq("id", data.user.id)
  .single();

setAvatar(profile?.avatar ?? "");
setUsername(profile?.username ?? "");
}
  
      const { count } = await supabase
  .from("notifications")
  .select("*", { count: "exact", head: true })
  .eq("user_id", data.user.id)
  .eq("is_read", false);

setNotificationCount(count ?? 0);

}
   } 

   getUser();

   const {
     data: { subscription },
   } = supabase.auth.onAuthStateChange((_event, session) => {
     setUser(session?.user ?? null);
   });

   const notificationChannel = supabase
  .channel("navbar-notifications")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
    },
    async () => {

      const { data } = await supabase.auth.getUser();

      if (!data.user) return;

      const { count } = await supabase
  .from("notifications")
  .select("*", { count: "exact", head: true })
  .eq("user_id", data.user.id)
  .eq("is_read", false);

setNotificationCount(count ?? 0);
    }
  )
  .subscribe();

   return () => {
  subscription.unsubscribe();
  supabase.removeChannel(notificationChannel);
};
 }, []);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
  profileMenuRef.current &&
  !profileMenuRef.current.contains(event.target as Node)
) {
  setProfileMenuOpen(false);
}

if (
  aboutMenuRef.current &&
  !aboutMenuRef.current.contains(event.target as Node)
) {
  setAboutMenuOpen(false);
}
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


   function handleLogoClick() {
   clickCount.current++;

   if (clickTimer.current) {
    clearTimeout(clickTimer.current);
   }

   if (clickCount.current === 3) {
   clickCount.current = 0;

   const loggedIn =
     localStorage.getItem("alamatika-admin") === "true";

   if (loggedIn) {
     router.push("/admin");
   } else {
    router.push("/admin/login");
   }

   return;

 }

  clickTimer.current = setTimeout(() => {
    if (clickCount.current === 1) {
      router.push("/");
    }

    clickCount.current = 0;
  }, 400);
}
  
  return (
    <>
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-3">

  <Image
    src="/logos/alamatika-navbar-v1.png"
    alt="Alamatika"
    width={250}
    height={80}
    priority
    onClick={handleLogoClick}
    className="h-8 md:h-12 w-auto hover:opacity-90 transition cursor-pointer"
  />


  <button
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  className="md:hidden text-3xl text-yellow-400"
>
  ☰
</button>

      <div className="hidden md:flex gap-8 text-sm md:text-base">
        <Link href="/" className="hover:text-yellow-400">Home</Link>
        <Link href="/read" className="hover:text-yellow-400">Read</Link>
        <Link href="/characters" className="hover:text-yellow-400">Characters</Link>
        <Link href="/lore" className="hover:text-yellow-400">Lore</Link>
        <Link href="/news" className="hover:text-yellow-400">News</Link>
        <Link href="/community" className="hover:text-yellow-400">Community</Link>
        <div
  ref={aboutMenuRef}
  className="relative"
>
  <button
    onClick={() => setAboutMenuOpen(!aboutMenuOpen)}
    className="hover:text-yellow-400 transition"
  >
    About ▼
  </button>

  {aboutMenuOpen && (
    <div className="absolute mt-3 w-56 rounded-2xl bg-zinc-900 border border-yellow-500/40 shadow-2xl overflow-hidden">

      <Link
        href="/about"
        onClick={() => setAboutMenuOpen(false)}
        className="block px-5 py-4 hover:bg-zinc-800"
      >
        📖 About
      </Link>

      <Link
        href="/about/privacy"
        onClick={() => setAboutMenuOpen(false)}
        className="block px-5 py-4 hover:bg-zinc-800"
      >
        🔒 Privacy Policy
      </Link>

      <Link
        href="/about/terms"
        onClick={() => setAboutMenuOpen(false)}
        className="block px-5 py-4 hover:bg-zinc-800"
      >
        📜 Terms of Service
      </Link>

      <Link
        href="/about/faq"
        onClick={() => setAboutMenuOpen(false)}
        className="block px-5 py-4 hover:bg-zinc-800"
      >
        ❓ FAQ
      </Link>

      <Link
        href="/about/contact"
        onClick={() => setAboutMenuOpen(false)}
        className="block px-5 py-4 hover:bg-zinc-800"
      >
        ✉️ Contact
      </Link>

    </div>
  )}
</div>

<Link
  href="/notifications"
  className="relative hover:opacity-80 transition flex items-center"
>
  <span className="text-2xl">🔔</span>

  {notificationCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold px-1">
      {notificationCount}
    </span>
  )}
</Link>

<button
  onClick={() => setChatOpen(true)}
  className="hover:opacity-80 transition text-2xl"
>
  💬
</button>

        {user ? (
  <div
  ref={profileMenuRef}
  className="relative"
>

  <button
  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
  className="flex items-center gap-2 hover:opacity-80 transition"
>
  {avatar ? (
    <img
      src={avatar}
      alt="Profile"
      className="w-9 h-9 rounded-full object-cover border border-yellow-500"
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center">
      👤
    </div>
  )}

  <span className="text-gray-400 text-xs">▼</span>
</button>

  {profileMenuOpen && (

    <div className="absolute right-0 mt-3 z-50 w-64 rounded-2xl bg-zinc-900 border border-yellow-500/40 shadow-2xl backdrop-blur-md overflow-hidden">

  <div className="flex items-center gap-4 px-5 py-5 border-b border-zinc-700">

    {avatar ? (
      <img
        src={avatar}
        alt={username}
        className="w-14 h-14 rounded-full object-cover border-2 border-yellow-500"
      />
    ) : (
      <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-xl">
        👤
      </div>
    )}

    <div className="overflow-hidden">
      <p className="font-bold text-yellow-400 truncate">
        {username}
      </p>

      <p className="text-xs text-gray-500 truncate">
        @{username.toLowerCase()}
      </p>
    </div>

  </div>

  <Link
  href={`/profile/${user?.id}`}
  onClick={() => setProfileMenuOpen(false)}
  className="block px-5 py-4 hover:bg-zinc-800"
>
  👤 View Profile
</Link>

<Link
  href="/profile/posts"
  onClick={() => setProfileMenuOpen(false)}
  className="block px-5 py-4 hover:bg-zinc-800"
>
  📄 My Posts
</Link>

<Link
  href="/profile/bookmarks"
  onClick={() => setProfileMenuOpen(false)}
  className="block px-5 py-4 hover:bg-zinc-800"
>
  🔖 Bookmarks
</Link>


      <button
  onClick={logout}
  className="w-full text-left px-5 py-4 hover:bg-red-700 transition"
>
  🚪 Logout
</button>

    </div>

  )}

</div>
) : (
  <Link
    href="/login"
    onClick={() => setProfileMenuOpen(false)}
    className="px-4 py-2 rounded-lg border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition"
  >
    Login
  </Link>
)}

        
</div>

{mobileMenuOpen && (
  <div className="fixed top-20 left-0 w-full bg-black/95 backdrop-blur-md z-40 flex flex-col items-center py-8 gap-6 md:hidden">

    <Link href="/" onClick={() => setMobileMenuOpen(false)}>
      Home
    </Link>

    <Link href="/read" onClick={() => setMobileMenuOpen(false)}>
      Read
    </Link>

    <Link href="/characters" onClick={() => setMobileMenuOpen(false)}>
      Characters
    </Link>

    <Link href="/lore" onClick={() => setMobileMenuOpen(false)}>
      Lore
    </Link>

    <Link href="/news" onClick={() => setMobileMenuOpen(false)}>
      News
    </Link>

    <Link href="/community" onClick={() => setMobileMenuOpen(false)}>
      Community
    </Link>

    <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
      About
    </Link>

    {user ? (
      <>
        <Link
  href={`/profile/${user?.id}`}
  onClick={() => setMobileMenuOpen(false)}
>
          👤 {username}
        </Link>

        <Link href="/notifications" onClick={() => setMobileMenuOpen(false)}>
          Notifications
        </Link>

        <Link
  href="/profile/posts"
  onClick={() => setMobileMenuOpen(false)}
>
  📄 My Posts
</Link>

<Link
  href="/profile/bookmarks"
  onClick={() => setMobileMenuOpen(false)}
>
  🔖 Bookmarks
</Link>

        <button
          onClick={() => {
            setMobileMenuOpen(false);
            logout();
          }}
          className="text-red-400"
        >
          Logout
        </button>
      </>
    ) : (
      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
        Login
      </Link>
    )}

  </div>
)}


    </nav>
    <ChatPopup
  open={chatOpen}
  onClose={() => setChatOpen(false)}
  hideButton
/>
    </>
    
  );

  
}
