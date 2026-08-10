"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Suspense, useEffect, useState } from "react";

function PurchaseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirect =
    searchParams.get("redirect") ?? "";

  const chapterNumber = searchParams
  .get("redirect")
  ?.match(/chapter-(\d+)/)?.[1];
  const [credits, setCredits] = useState(0);

const [transactions, setTransactions] = useState<
  {
    id: number;
    amount: number;
    description: string;
    created_at: string;
  }[]
>([]);

const [purchases, setPurchases] = useState<
  {
    id: number;
    credits: number;
    peso_amount: number;
    status: string;
    created_at: string;
  }[]
>([]);


async function loadWallet() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  setCredits(profile?.credits ?? 0);

  const { data: history } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

    const { data: purchases } = await supabase
  .from("credit_purchases")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

  setTransactions(history ?? []);

}

useEffect(() => {
  (async () => {
    await loadWallet();
  })();
}, []);

async function buyCredits(packageAmount: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  try {
    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credits: packageAmount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Could not create payment.");
      return;
    }

    window.location.href = result.checkoutUrl;
  } catch (error) {
    console.error(error);
    alert("Something went wrong starting the payment.");
  }
}

async function unlockWithCredits() {

const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (!profile) {
    alert("Profile not found.");
    return;
  }

  if (profile.credits < 25) {
    alert("Not enough Credits.");
    return;
  }

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("chapter", Number(chapterNumber))
    .single();

  if (!chapter) {
    alert("Chapter not found.");
    return;
  }

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("chapter_unlocks")
    .select("id")
    .eq("user_id", user.id)
    .eq("chapter_id", chapter.id)
    .maybeSingle();

  if (existing) {
    router.push(`/read/chapter-${chapterNumber}`);
    return;
  }

  // Deduct credits
  const { error: creditError } = await supabase
    .from("profiles")
    .update({
      credits: profile.credits - 25,
    })
    .eq("id", user.id);

  if (creditError) {
    alert(creditError.message);
    return;
  }

  // Save unlock
  const { error: unlockError } = await supabase
    .from("chapter_unlocks")
    .insert({
      user_id: user.id,
      chapter_id: chapter.id,
    });

  if (unlockError) {
    alert(unlockError.message);
    return;
  }



  // Save wallet transaction
await supabase
  .from("credit_transactions")
  .insert({
    user_id: user.id,
    amount: -25,
    type: "unlock",
    description: `Unlocked Chapter ${chapterNumber}`,
  });

  await loadWallet();

  alert("Chapter Unlocked!");

  router.push(`/read/chapter-${chapterNumber}`);
}


  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">

        <h1 className="text-5xl font-bold text-yellow-400 mb-6">
          💎 Wallet
        </h1>

        <p className="text-gray-300 mb-10">
          Purchase Credits to unlock premium chapters.
        </p>

        <div className="bg-zinc-900 rounded-2xl p-6 mb-8 border border-yellow-500/30">
  <p className="text-gray-400 text-sm">Current Balance</p>

  <h2 className="text-5xl font-bold text-yellow-400 mt-2">
    💎 {credits}
  </h2>
</div>

        <div className="flex flex-col gap-4">

          <div className="bg-zinc-900 rounded-2xl p-6">

<h2 className="text-2xl font-bold text-yellow-400">
Top Up Wallet
</h2>

<div className="grid gap-5">

  {chapterNumber ? (
  credits >= 25 ? (
    <button
      onClick={unlockWithCredits}
      className="inline-block px-8 py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
    >
      💎 Use 25 Credits
    </button>
  ) : (
    <button
      className="inline-block px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition"
    >
      💎 Buy Credits
    </button>
  )
) : null}

  <button
  onClick={() => buyCredits(100)}
  className="bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-2xl p-6 text-left transition"
>

    <div className="flex justify-between items-center">

      <div>
        <h3 className="text-3xl font-bold text-yellow-400">
          ₱100
        </h3>

        <p className="text-gray-400 mt-2">
          💎 Receive 100 Credits
        </p>

        <p className="text-sm text-gray-500 mt-3">
          Perfect for unlocking 4 chapters.
        </p>
      </div>

      <span className="bg-yellow-500 text-black px-5 py-2 rounded-xl font-bold">
        Buy
      </span>

    </div>

  </button>

  <button
  onClick={() => buyCredits(300)}
  className="relative bg-zinc-800 border-2 border-yellow-500 hover:border-yellow-400 rounded-2xl p-6 text-left transition"
>

    <span className="absolute -top-3 right-5 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
      MOST POPULAR
    </span>

    <div className="flex justify-between items-center">

      <div>
        <h3 className="text-3xl font-bold text-yellow-400">
          ₱300
        </h3>

        <p className="text-gray-400 mt-2">
          💎 Receive 300 Credits
        </p>

        <p className="text-sm text-gray-500 mt-3">
          Great for regular readers.
        </p>
      </div>

      <span className="bg-yellow-500 text-black px-5 py-2 rounded-xl font-bold">
        Buy
      </span>

    </div>

  </button>

  <button
  onClick={() => buyCredits(600)}
  className="bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-2xl p-6 text-left transition"
>

    <div className="flex justify-between items-center">

      <div>
        <h3 className="text-3xl font-bold text-yellow-400">
          ₱600
        </h3>

        <p className="text-gray-400 mt-2">
          💎 Receive 600 Credits
        </p>

        <p className="text-sm text-gray-500 mt-3">
          Unlock 24 chapters.
        </p>
      </div>

      <span className="bg-yellow-500 text-black px-5 py-2 rounded-xl font-bold">
        Buy
      </span>

    </div>

  </button>

  <button
  onClick={() => buyCredits(1200)}
  className="bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-2xl p-6 text-left transition"
>

    <div className="flex justify-between items-center">

      <div>
        <h3 className="text-3xl font-bold text-yellow-400">
          ₱1200
        </h3>

        <p className="text-gray-400 mt-2">
          💎 Receive 1200 Credits
        </p>

        <p className="text-sm text-gray-500 mt-3">
          Best for binge reading.
        </p>
      </div>

      <span className="bg-yellow-500 text-black px-5 py-2 rounded-xl font-bold">
        Buy
      </span>

    </div>

  </button>

</div>
</div>
          

<div className="bg-zinc-900 rounded-2xl p-6 mt-8 text-left">
  <h2 className="text-2xl font-bold text-yellow-400 mb-4">
    Recent Activity
  </h2>

  {transactions.length === 0 ? (
    <p className="text-gray-500">
      No transactions yet.
    </p>
  ) : (
    <div className="space-y-4">
      {transactions.map((item) => (
        <div
          key={item.id}
          className="flex justify-between border-b border-zinc-700 pb-3"
        >
          <div>
            <p>{item.description}</p>

            <p className="text-gray-500 text-sm">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>

          <div
            className={`font-bold ${
              item.amount > 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {item.amount > 0 ? "+" : ""}
            {item.amount}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

          <Link
  href="/read"
  className="inline-block mt-8 px-6 py-3 border border-yellow-500 rounded-full text-yellow-400 hover:bg-yellow-500 hover:text-black transition"
>
  ← Back to Chapters
</Link>

        </div>

      </div>
    </main>
  );
}

export default function PurchasePage() {
  return (
    <Suspense>
      <PurchaseContent />
    </Suspense>
  );
}