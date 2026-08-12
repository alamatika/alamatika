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
  try {
    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  credits: packageAmount,
  redirect,
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
  if (!chapterNumber) {
    alert("Chapter not found.");
    return;
  }

  try {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("chapter", Number(chapterNumber))
      .single();

    if (!chapter) {
      alert("Chapter not found.");
      return;
    }

    const response = await fetch("/api/chapters/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chapterId: chapter.id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Could not unlock the chapter.");
      return;
    }

    await loadWallet();

    alert("Chapter Unlocked!");

    router.push(`/read/chapter-${chapterNumber}`);
  } catch (error) {
    console.error("Unlock error:", error);
    alert("Something went wrong unlocking the chapter.");
  }
}

    return (
    <main className="min-h-screen bg-black text-white px-4 py-24">

      <div className="max-w-lg mx-auto">

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">

          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-yellow-400 transition text-sm"
          >
            ← Back
          </button>

          <Link
            href="/"
            className="text-gray-400 hover:text-yellow-400 transition text-sm"
          >
            🏠 Home
          </Link>

        </div>


        {/* Wallet Header */}
        <div className="text-center mb-6">

          <h1 className="text-3xl font-bold text-yellow-400">
            💎 Wallet
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Purchase Credits to unlock premium chapters.
          </p>

        </div>


        {/* Current Balance */}
        <div className="bg-zinc-900 rounded-2xl p-4 mb-6 border border-yellow-500/30 text-center">

          <p className="text-gray-500 text-xs">
            Current Balance
          </p>

          <h2 className="text-3xl font-bold text-yellow-400 mt-1">
            💎 {credits}
          </h2>

        </div>


        {/* Top Up Wallet */}
        <div className="bg-zinc-900 rounded-2xl p-4">

          <h2 className="text-xl font-bold text-yellow-400 mb-4">
            Top Up Wallet
          </h2>


          <div className="grid gap-3">

            {/* Chapter Unlock */}
            {chapterNumber ? (
              credits >= 25 ? (
                <button
                  onClick={unlockWithCredits}
                  className="w-full px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition text-sm"
                >
                  💎 Use 25 Credits
                </button>
              ) : (
                <button
                  onClick={() => buyCredits(100)}
                  className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition text-sm"
                >
                  💎 Buy Credits
                </button>
              )
            ) : null}


            {/* ₱100 */}
            <button
              onClick={() => buyCredits(100)}
              className="bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-xl p-4 text-left transition"
            >

              <div className="flex justify-between items-center gap-3">

                <div>

                  <h3 className="text-2xl font-bold text-yellow-400">
                    ₱100
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    💎 Receive 100 Credits
                  </p>

                  <p className="text-gray-500 text-xs mt-2">
                    Perfect for unlocking 4 chapters.
                  </p>

                </div>

                <span className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm shrink-0">
                  Buy
                </span>

              </div>

            </button>


            {/* ₱300 */}
            <button
              onClick={() => buyCredits(300)}
              className="relative bg-zinc-800 border border-yellow-500 hover:border-yellow-400 rounded-xl p-4 text-left transition"
            >

              <span className="absolute -top-2 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-[10px] font-bold">
                MOST POPULAR
              </span>

              <div className="flex justify-between items-center gap-3">

                <div>

                  <h3 className="text-2xl font-bold text-yellow-400">
                    ₱300
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    💎 Receive 300 Credits
                  </p>

                  <p className="text-gray-500 text-xs mt-2">
                    Great for regular readers.
                  </p>

                </div>

                <span className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm shrink-0">
                  Buy
                </span>

              </div>

            </button>


            {/* ₱600 */}
            <button
              onClick={() => buyCredits(600)}
              className="bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-xl p-4 text-left transition"
            >

              <div className="flex justify-between items-center gap-3">

                <div>

                  <h3 className="text-2xl font-bold text-yellow-400">
                    ₱600
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    💎 Receive 600 Credits
                  </p>

                  <p className="text-gray-500 text-xs mt-2">
                    Unlock 24 chapters.
                  </p>

                </div>

                <span className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm shrink-0">
                  Buy
                </span>

              </div>

            </button>


            {/* ₱1200 */}
            <button
              onClick={() => buyCredits(1200)}
              className="bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-xl p-4 text-left transition"
            >

              <div className="flex justify-between items-center gap-3">

                <div>

                  <h3 className="text-2xl font-bold text-yellow-400">
                    ₱1200
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    💎 Receive 1200 Credits
                  </p>

                  <p className="text-gray-500 text-xs mt-2">
                    Best for binge reading.
                  </p>

                </div>

                <span className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm shrink-0">
                  Buy
                </span>

              </div>

            </button>

          </div>

        </div>


        {/* Recent Activity */}
        <div className="bg-zinc-900 rounded-2xl p-4 mt-6">

          <h2 className="text-xl font-bold text-yellow-400 mb-4">
            Recent Activity
          </h2>

          {transactions.length === 0 ? (

            <p className="text-gray-500 text-sm">
              No transactions yet.
            </p>

          ) : (

            <div className="space-y-3">

              {transactions.map((item) => (

                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b border-zinc-700 pb-3"
                >

                  <div className="min-w-0">

                    <p className="text-sm">
                      {item.description}
                    </p>

                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>

                  </div>

                  <div
                    className={`font-bold text-sm shrink-0 ${
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


        {/* Bottom Back */}
        <div className="flex justify-center gap-3 mt-6">

          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-zinc-700 rounded-full text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition text-sm"
          >
            ← Back
          </button>

          <Link
            href="/"
            className="px-5 py-2.5 border border-yellow-500 rounded-full text-yellow-400 hover:bg-yellow-500 hover:text-black transition text-sm"
          >
            🏠 Home
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