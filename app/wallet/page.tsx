"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Suspense, useEffect, useState } from "react";
import Navbar from "../../components/navbar";

function PurchaseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirect =
    searchParams.get("redirect") ?? "";

  const chapterNumber = searchParams
  .get("redirect")
  ?.match(/chapter-(\d+)/)?.[1];
  const [credits, setCredits] = useState(0);

  const [manualPaymentAmount, setManualPaymentAmount] =
  useState<number | null>(null);

const [paymentCode, setPaymentCode] = useState("");
const [paymentMethod, setPaymentMethod] = useState("");

const [manualSubmitting, setManualSubmitting] =
  useState(false);

const [transactions, setTransactions] = useState<
  {
    id: number;
    amount: number;
    description: string;
    created_at: string;
  }[]
>([]);

type ManualPayment = {
  id: number;
  created_at: string;
  payment_code: string | null;
  credits: number;
  peso_amount: number;
  payment_provider: string | null;
  status: string;
  approved_at: string | null;
};

const [manualPayments, setManualPayments] = useState<
  ManualPayment[]
>([]);

type PaymentSetting = {
  id: number;
  payment_method: string;
  qr_url: string | null;
  account_name: string | null;
  account_number: string | null;
};

const [paymentSettings, setPaymentSettings] = useState<
  PaymentSetting[]
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

  setTransactions(history ?? []);

  const { data: manualPaymentHistory, error: manualPaymentError } =
  await supabase
    .from("manual_payments")
    .select(`
      id,
      created_at,
      payment_code,
      credits,
      peso_amount,
      payment_provider,
      status,
      approved_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

if (manualPaymentError) {
  console.error(
    "Could not load manual payment history:",
    manualPaymentError
  );
} else {
  setManualPayments(manualPaymentHistory ?? []);
}

}

async function loadPaymentSettings() {
  try {
    const response = await fetch(
      "/api/payment-settings",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Could not load payment settings:",
        result?.error
      );
      return;
    }

    setPaymentSettings(result.settings ?? []);
  } catch (error) {
    console.error(
      "Payment settings error:",
      error
    );
  }
}

useEffect(() => {
  (async () => {
    await loadWallet();
    await loadPaymentSettings();
  })();
}, []);

async function buyCredits(packageAmount: number) {
  try {
    console.log("WALLET PAYMENT REDIRECT:", redirect);
console.log("WALLET CURRENT URL:", window.location.href);

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

function getSelectedPaymentSetting() {
  return paymentSettings.find(
    (setting) =>
      setting.payment_method === paymentMethod
  );
}

async function submitManualPayment() {
  if (!manualPaymentAmount) {
    return;
  }

  if (!paymentMethod) {
  alert("Please select a payment method.");
  return;
}

  const code = paymentCode.trim();

  if (code.length < 4) {
    alert("Please enter a valid payment confirmation code.");
    return;
  }

  try {
    setManualSubmitting(true);

    const response = await fetch(
      "/api/manual-payments/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
  credits: manualPaymentAmount,
  paymentCode: code,
  paymentMethod,
}),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(
        result?.error ??
          "Could not submit manual payment."
      );
      return;
    }

    alert(
      "Payment confirmation submitted! Your credits will be released after creator approval."
    );

    setPaymentCode("");
    setPaymentMethod("");
    setManualPaymentAmount(null);

    await loadWallet();
  } catch (error) {
    console.error(
      "Manual payment error:",
      error
    );

    alert(
      "Something went wrong submitting the payment."
    );
  } finally {
    setManualSubmitting(false);
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
      <>
      <Navbar />
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
            
              <div className="bg-zinc-800 border border-zinc-700 hover:border-yellow-500 rounded-xl p-4 text-left transition">
            

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

                <div className="flex flex-col gap-2 shrink-0">
  <button
  type="button"
    onClick={() => buyCredits(100)}
    className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400 transition"
  >
    PayMongo
  </button>

  <button
  type="button"
  onClick={() => {
    console.log("MANUAL BUTTON CLICKED");
    setManualPaymentAmount(100);

  alert("Manual clicked!");
  }}
  className="border border-zinc-600 text-gray-300 px-4 py-2 rounded-lg font-bold text-sm hover:border-yellow-500 hover:text-yellow-400 transition"
>
  Manual
</button>
</div>

              </div>

            </div>


            {/* ₱300 */}
            
              <div className="relative bg-zinc-800 border border-yellow-500 hover:border-yellow-400 rounded-xl p-4 text-left transition"
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

                <div className="flex flex-col gap-2 shrink-0">
  <button
  type="button"
    onClick={() => buyCredits(300)}
    className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400 transition"
  >
    PayMongo
  </button>

  <button
  type="button"
    onClick={() => setManualPaymentAmount(300)}
    className="border border-zinc-600 text-gray-300 px-4 py-2 rounded-lg font-bold text-sm hover:border-yellow-500 hover:text-yellow-400 transition"
  >
    Manual
  </button>
</div>

              </div>

            </div>


            {/* ₱600 */}
            <div
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

                <div className="flex flex-col gap-2 shrink-0">
  <button
  type="button"
    onClick={() => buyCredits(600)}
    className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400 transition"
  >
    PayMongo
  </button>

  <button
  type="button"
    onClick={() => setManualPaymentAmount(600)}
    className="border border-zinc-600 text-gray-300 px-4 py-2 rounded-lg font-bold text-sm hover:border-yellow-500 hover:text-yellow-400 transition"
  >
    Manual
  </button>
</div>

              </div>

            </div>


          </div>

          {manualPaymentAmount !== null && (
  <div
  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-4 overflow-y-auto"
    onClick={() => {
      if (!manualSubmitting) {
        setManualPaymentAmount(null);
        setPaymentMethod("");
        setPaymentCode("");
      }
    }}
  >
    <div
  className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-yellow-500/40 rounded-2xl shadow-2xl p-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-yellow-400">
            Manual Payment
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Submit your payment confirmation code.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!manualSubmitting) {
              setManualPaymentAmount(null);
              setPaymentCode("");
            }
          }}
          disabled={manualSubmitting}
          className="text-gray-500 hover:text-white text-2xl leading-none disabled:opacity-40"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Payment Content */}
<div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* LEFT — QR */}
  <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">

    <p className="text-gray-400 text-sm mb-3">
      Send your payment to:
    </p>

    {paymentMethod ? (
      getSelectedPaymentSetting()?.qr_url ? (
        <>
          <p className="text-yellow-400 font-bold text-lg mb-3">
            {paymentMethod}
          </p>

          <div className="bg-white rounded-xl p-4 w-fit mx-auto">
            <img
              src={
                getSelectedPaymentSetting()?.qr_url ?? ""
              }
              alt={`${paymentMethod} QR Code`}
              className="w-56 h-56 object-contain"
            />
          </div>

          {getSelectedPaymentSetting()?.account_name && (
            <p className="text-gray-300 text-sm text-center mt-4">
              {getSelectedPaymentSetting()?.account_name}
            </p>
          )}

          {getSelectedPaymentSetting()?.account_number && (
            <p className="text-gray-500 text-xs text-center mt-1">
              {getSelectedPaymentSetting()?.account_number}
            </p>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-20">
          QR code is not available for this payment method.
        </div>
      )
    ) : (
      <div className="text-center text-gray-500 py-20">
        Select a payment method to view its QR code.
      </div>
    )}

  </div>


  {/* RIGHT — PAYMENT DETAILS */}
  <div>

    {/* Payment summary */}
    <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">

      <p className="text-gray-400 text-sm">
        Selected package
      </p>

      <div className="flex justify-between items-center mt-2">

        <span className="text-xl font-bold text-white">
          ₱{manualPaymentAmount}
        </span>

        <span className="text-yellow-400 font-bold">
          💎 {manualPaymentAmount} Credits
        </span>

      </div>

    </div>


    {/* Instructions */}
    <div className="mt-5">

      <p className="text-gray-400 text-sm">
        Send your payment using the selected method,
        then enter the confirmation code below.
      </p>

    </div>


    {/* Payment Method */}
    <div className="mt-5">

      <p className="text-gray-400 text-sm mb-3">
        Choose your payment method
      </p>

      <div className="grid grid-cols-3 gap-2">

        <button
          type="button"
          onClick={() => setPaymentMethod("GCash")}
          disabled={manualSubmitting}
          className={`px-3 py-3 rounded-xl border font-bold text-sm transition ${
            paymentMethod === "GCash"
              ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
              : "border-zinc-700 text-gray-300 hover:border-yellow-500"
          }`}
        >
          GCash
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod("Coins.ph")}
          disabled={manualSubmitting}
          className={`px-3 py-3 rounded-xl border font-bold text-sm transition ${
            paymentMethod === "Coins.ph"
              ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
              : "border-zinc-700 text-gray-300 hover:border-yellow-500"
          }`}
        >
          Coins.ph
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod("Maya")}
          disabled={manualSubmitting}
          className={`px-3 py-3 rounded-xl border font-bold text-sm transition ${
            paymentMethod === "Maya"
              ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
              : "border-zinc-700 text-gray-300 hover:border-yellow-500"
          }`}
        >
          Maya
        </button>

      </div>

    </div>


    {/* Confirmation Code */}
    <div className="mt-5">

      <label
        htmlFor="manual-payment-code"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Payment Confirmation Code
      </label>

      <input
        id="manual-payment-code"
        type="text"
        value={paymentCode}
        onChange={(e) =>
          setPaymentCode(e.target.value)
        }
        placeholder="Enter confirmation code"
        disabled={manualSubmitting}
        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder:text-gray-600 outline-none focus:border-yellow-500 transition disabled:opacity-50"
      />

    </div>


    {/* Buttons */}
    <div className="flex gap-3 mt-5">

      <button
        type="button"
        onClick={submitManualPayment}
        disabled={manualSubmitting}
        className="flex-1 px-4 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
      >
        {manualSubmitting
          ? "Submitting..."
          : "Submit Payment"}
      </button>

      <button
        type="button"
        onClick={() => {
          setManualPaymentAmount(null);
          setPaymentCode("");
          setPaymentMethod("");
        }}
        disabled={manualSubmitting}
        className="px-5 py-3 rounded-xl border border-zinc-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition disabled:opacity-40"
      >
        Cancel
      </button>

    </div>

  </div>

</div>

    </div>
  </div>
)}

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
    </>
  );
}

export default function PurchasePage() {
  return (
    <Suspense>
      <PurchaseContent />
    </Suspense>
  );
}