"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../components/navbar";
import { supabase } from "../../../../lib/supabaseClient";

type Profile = {
  id: string;
  username: string;
  avatar: string;
};

export default function FollowersPage() {
  const { id } = useParams();

  const [followers, setFollowers] = useState<Profile[]>([]);

  useEffect(() => {
    
     async function loadFollowers() {

  const { data: followerRows } = await supabase
    .from("followers")
    .select("follower_id")
    .eq("following_id", id);

  if (!followerRows || followerRows.length === 0) {
    setFollowers([]);
    return;
  }

  const ids = followerRows.map((f) => f.follower_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar")
    .in("id", ids);

  setFollowers(profiles ?? []);

}

if (id) {
  loadFollowers();
}

}, [id]);


  return (
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-4xl mx-auto pt-32 px-6">

        <h1 className="text-5xl font-bold text-yellow-400 mb-10">
          Followers
        </h1>

        <p className="text-gray-400 mb-10">
          People following this reader.
        </p>

        <div className="space-y-6">

          {followers.map((person) => (

            <Link
              key={person.id}
              href={`/profile/${person.id}`}
              className="flex items-center gap-5 bg-zinc-900 rounded-2xl p-5 hover:bg-zinc-800 transition"
            >

              {person.avatar ? (

                <img
                  src={person.avatar}
                  className="w-16 h-16 rounded-full object-cover"
                />

              ) : (

                <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-3xl">
                  👤
                </div>

              )}

              <p className="text-xl font-bold">
                {person.username}
              </p>

            </Link>

          ))}

        </div>

      </section>

    </main>
  );
}