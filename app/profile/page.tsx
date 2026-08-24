"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

export default function ProfilePage() {

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  credits: number;
  email_private: boolean;
  is_admin: boolean;
};

type Purchase = {
  id: number;
  created_at: string;
  payment_code: string | null;
  credits: number;
  peso_amount: number;
  payment_provider: string | null;
  status: string;
  expires_at: string | null;
  approved_at: string | null;
};
  
  const [profile, setProfile] = useState<Profile | null>(null);
const [email, setEmail] = useState("");

const [purchases, setPurchases] = useState<Purchase[]>([]);
const [purchasesLoading, setPurchasesLoading] = useState(true);
const [showAllApproved, setShowAllApproved] = useState(false);
const [purchaseHistoryOpen, setPurchaseHistoryOpen] = useState(false);


  const router = useRouter();

  useEffect(() => {
  let cancelled = false;

  async function loadProfileData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      // ==========================================
      // LOAD PROFILE
      // ==========================================

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error(
          "Could not load profile:",
          profileError
        );
      }

      if (!cancelled) {
        setProfile(profileData);
      }

      // ==========================================
      // LOAD MANUAL PURCHASES
      // ==========================================

      const response = await fetch(
        "/api/profile/purchases",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      console.log(
        "PROFILE PURCHASES API:",
        result
      );

      if (!response.ok) {
        console.error(
          result?.error ||
            "Could not load purchases."
        );

        return;
      }

      if (!cancelled) {
        const purchaseList = Array.isArray(
          result?.purchases
        )
          ? result.purchases
          : [];

        console.log(
          "SETTING PURCHASES:",
          purchaseList
        );

        setPurchases(purchaseList);
      }

    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );

    } finally {
      if (!cancelled) {
        setPurchasesLoading(false);
      }
    }
  }

  loadProfileData();

  const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(
  (_event, session) => {
    if (!session) {
      router.replace("/");
    }
  }
);

  return () => {
  cancelled = true;
  subscription.unsubscribe();
};
}, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

console.log(
  "PROFILE RENDER PURCHASES:",
  purchases,
  "LOADING:",
  purchasesLoading
); 

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-3xl mx-auto pt-32 px-6">

        <div className="bg-zinc-900 rounded-2xl p-10 space-y-5">

          <h2 className="text-4xl font-bold text-center">
            👤 {profile?.username}
          </h2>

          <div className="flex justify-center mb-6">

{profile?.avatar ? (

<img
  src={profile.avatar}
  className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500"
/>

) : (

<div className="w-32 h-32 rounded-full bg-zinc-500 flex items-center justify-center text-5xl">
👤
</div>

)}

</div>

<h2 className="text-4xl font-bold text-center">
  {profile?.username}
</h2>

<p className="text-gray-500 italic text-center max-w-xl mx-auto mt-3 leading-8">
  {profile?.bio || "This reader hasn't written a bio yet."}
</p>

      <div className="border-t border-zinc-700 pt-6 mt-6">

<h3 className="text-yellow-400 font-bold mb-2">
📧 Email
</h3>

<p className="text-gray-400">
{profile?.email_private ? "Hidden" : email}
</p>

</div>

<div className="border-t border-zinc-700 pt-6 mt-6">

  <h3 className="text-yellow-400 font-bold mb-2">
    🆔 User ID
  </h3>

  <div className="flex items-center gap-2">
    <p className="text-gray-400 text-sm break-all flex-1">
      {profile?.id || "Loading User ID..."}
    </p>

    {profile?.id && (
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(profile.id);
            alert("User ID copied!");
          } catch (error) {
            console.error(error);
            alert("Could not copy User ID.");
          }
        }}
        className="shrink-0 px-3 py-2 rounded-lg border border-zinc-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition text-xs"
      >
        Copy
      </button>
    )}
  </div>

  <p className="text-gray-600 text-xs mt-2">
    Your unique account ID.
  </p>

</div>

<Link
  href="/wallet"
  className="block mt-6 rounded-2xl border border-yellow-500/30 bg-zinc-800 p-6 hover:border-yellow-400 hover:bg-zinc-700 transition"
>

<div className="flex justify-between items-center">

<div>

<h3 className="text-yellow-400 font-bold">
💎 Wallet
</h3>

<p className="text-yellow-400 font-bold text-lg">
💎 {profile?.credits ?? 0} Credits
</p>

<p className="text-gray-500 text-sm">
Manage Wallet →
</p>

</div>

<div className="text-yellow-400 font-bold">
→
</div>

</div>

</Link> 

{/* ==========================================
    PURCHASE HISTORY
========================================== */}

<div className="mt-8 border-t border-zinc-700 pt-6">

  <button
    type="button"
    onClick={() =>
      setPurchaseHistoryOpen(
        !purchaseHistoryOpen
      )
    }
    className="w-full flex items-center justify-between gap-3 text-left"
  >

    <div>
      <h3 className="text-yellow-400 font-bold">
        💳 Purchase History
      </h3>

      {!purchasesLoading &&
        purchases.length > 0 && (
          <span className="text-xs text-gray-500">
            {purchases.length}{" "}
            {purchases.length === 1
              ? "purchase"
              : "purchases"}
          </span>
        )}
    </div>

    <span className="text-yellow-400 text-xl">
      {purchaseHistoryOpen
        ? "▲"
        : "▼"}
    </span>

  </button>

  {purchaseHistoryOpen && (
  <div className="mt-5">

  {purchasesLoading ? (

    <p className="text-gray-500 text-sm">
      Loading purchases...
    </p>

  ) : purchases.length === 0 ? (

    <div className="rounded-xl bg-zinc-800 p-5 text-center">
      <p className="text-gray-500 text-sm">
        No manual purchases yet.
      </p>
    </div>

  ) : (

    <div className="space-y-6">

      {/* ==========================================
          PENDING PURCHASES
      ========================================== */}

      {purchases.filter(
        (purchase) =>
          purchase.status === "pending"
      ).length > 0 && (

        <div>

          <h4 className="text-orange-400 font-bold mb-3">
            ⏳ Pending Purchases
            <span className="text-gray-500 text-xs ml-2">
              (
              {
                purchases.filter(
                  (purchase) =>
                    purchase.status ===
                    "pending"
                ).length
              }
              )
            </span>
          </h4>

          <div className="space-y-3">

            {purchases
              .filter(
                (purchase) =>
                  purchase.status === "pending"
              )
              .map((purchase) => (

                <div
                  key={purchase.id}
                  className="rounded-xl border border-orange-500/30 bg-zinc-800 p-4"
                >

                  <div className="flex justify-between items-start gap-3">

                    <div className="min-w-0">

                      <p className="font-bold text-white">
                        {purchase.payment_provider ||
                          "Manual Payment"}
                      </p>

                      <p className="text-yellow-400 font-bold mt-1">
                        ₱
                        {Number(
                          purchase.peso_amount
                        ).toLocaleString()}{" "}
                        → 💎{" "}
                        {purchase.credits} Credits
                      </p>

                    </div>

                    <span className="shrink-0 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold">
                      PENDING
                    </span>

                  </div>

                  <div className="mt-3">

                    <p className="text-gray-500 text-xs">
                      Payment Code
                    </p>

                    <p className="text-white font-mono text-sm break-all mt-1">
                      {purchase.payment_code ||
                        "—"}
                    </p>

                  </div>

                  <p className="text-gray-500 text-xs mt-3">
                    Submitted:{" "}
                    {new Date(
                      purchase.created_at
                    ).toLocaleString()}
                  </p>

                  <p className="text-orange-400 text-xs mt-2">
                    Waiting for Creator approval.
                  </p>

                </div>

              ))}

          </div>

        </div>
      )}


      {/* ==========================================
          APPROVED PURCHASES
      ========================================== */}

      {purchases.filter(
        (purchase) =>
          purchase.status === "approved"
      ).length > 0 && (

        <div>

          <div className="flex items-center justify-between gap-3 mb-3">

            <h4 className="text-green-400 font-bold">
              ✓ Approved Purchases
              <span className="text-gray-500 text-xs ml-2">
                (
                {
                  purchases.filter(
                    (purchase) =>
                      purchase.status ===
                      "approved"
                  ).length
                }
                )
              </span>
            </h4>

          </div>


          {/* Approved purchase list */}

          <div className="space-y-3">

            {purchases
              .filter(
                (purchase) =>
                  purchase.status ===
                  "approved"
              )
              .slice(
                0,
                showAllApproved
                  ? undefined
                  : 5
              )
              .map((purchase) => (

                <div
                  key={purchase.id}
                  className="rounded-xl border border-green-500/30 bg-zinc-800 p-4"
                >

                  <div className="flex justify-between items-start gap-3">

                    <div className="min-w-0">

                      <p className="font-bold text-white">
                        {purchase.payment_provider ||
                          "Manual Payment"}
                      </p>

                      <p className="text-yellow-400 font-bold mt-1">
                        ₱
                        {Number(
                          purchase.peso_amount
                        ).toLocaleString()}{" "}
                        → 💎{" "}
                        {purchase.credits} Credits
                      </p>

                    </div>

                    <span className="shrink-0 px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold">
                      APPROVED
                    </span>

                  </div>


                  <div className="mt-3">

                    <p className="text-gray-500 text-xs">
                      Payment Code
                    </p>

                    <p className="text-white font-mono text-sm break-all mt-1">
                      {purchase.payment_code ||
                        "—"}
                    </p>

                  </div>


                  <p className="text-gray-500 text-xs mt-3">
                    Submitted:{" "}
                    {new Date(
                      purchase.created_at
                    ).toLocaleString()}
                  </p>


                  {purchase.approved_at && (
                    <p className="text-green-400 text-xs mt-2">
                      Approved:{" "}
                      {new Date(
                        purchase.approved_at
                      ).toLocaleString()}
                    </p>
                  )}

                </div>

              ))}

          </div>


          {/* Expand / Collapse */}

          {
            purchases.filter(
              (purchase) =>
                purchase.status ===
                "approved"
            ).length > 5 && (

              <button
                type="button"
                onClick={() =>
                  setShowAllApproved(
                    !showAllApproved
                  )
                }
                className="w-full mt-4 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition"
              >
                {showAllApproved
                  ? "▲ Show less"
                  : `▼ Show all ${
                      purchases.filter(
                        (purchase) =>
                          purchase.status ===
                          "approved"
                      ).length
                    } approved purchases`}
              </button>

            )
          }

        </div>

      )}

    </div>

    )}

  </div>
)}

</div>

<div className="mt-8 flex flex-col gap-4">

  <Link
    href="/profile/settings/password"
    className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-4 hover:border-yellow-500 transition"
  >
    🔑 Change Password
  </Link>

  <Link
    href="/profile/settings/delete"
    className="rounded-xl border border-red-600 bg-zinc-800 px-6 py-4 text-red-400 hover:bg-red-900/20 transition"
  >
    🗑 Delete Account
  </Link>

</div>

<div className="mt-8 border-t border-zinc-700 pt-6">

  <h3 className="text-yellow-400 font-bold mb-4">
    ⚙️ Account Settings
  </h3>

  <div className="flex flex-col gap-3">

    <Link
      href="/profile/edit"
      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-4 transition"
    >
      ✏️ Edit Profile
    </Link>

    <Link
      href="/profile/settings"
      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-4 transition"
    >
      🔒 Security Settings
    </Link>

    {profile?.is_admin && (
  <Link
    href="/admin"
    className="rounded-xl bg-red-600 hover:bg-red-500 px-5 py-4 font-bold transition text-center"
  >
    🛡️ View as Admin
  </Link>
)}

    <button
      onClick={handleLogout}
      className="rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 px-5 py-4 font-bold transition"
    >
      🚪 Logout
    </button>

  </div>

</div>

        </div>

      </section>

    </main>
  );
}