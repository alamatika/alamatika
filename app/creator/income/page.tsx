"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

type Purchase = {
  id: number;
  user_id: string;
  credits: number;
  peso_amount: number;
  payment_provider: string | null;
  payment_reference: string | null;
  status: string;
  created_at: string;
};

export default function IncomeReport() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIncome() {
      const { data, error } = await supabase
        .from("credit_purchases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setPurchases(data ?? []);
      setLoading(false);
    }

    loadIncome();
  }, []);

  const paidPurchases = purchases.filter(
    (purchase) => purchase.status === "paid"
  );

  const pendingPurchases = purchases.filter(
    (purchase) => purchase.status === "pending"
  );

  const totalRevenue = paidPurchases.reduce(
    (sum, purchase) => sum + (purchase.peso_amount ?? 0),
    0
  );

  const totalCreditsSold = paidPurchases.reduce(
    (sum, purchase) => sum + (purchase.credits ?? 0),
    0
  );

  function downloadCSV() {
    const headers = [
      "Purchase ID",
      "Date",
      "Credits",
      "Amount (PHP)",
      "Payment Provider",
      "Payment Reference",
      "Status",
    ];

    const rows = purchases.map((purchase) => [
      purchase.id,
      new Date(purchase.created_at).toLocaleString(),
      purchase.credits,
      purchase.peso_amount,
      purchase.payment_provider ?? "",
      purchase.payment_reference ?? "",
      purchase.status,
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `alamatika-income-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-32 px-6 pb-20">

          {/* Navigation */}

          <Link
            href="/creator"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            🏠 Creator Studio
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-10">
            💰 Income Report
          </h1>

          {/* Summary */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

            <div className="bg-zinc-900 rounded-2xl p-6 border border-yellow-500/20">
              <h2 className="text-gray-400 text-sm mb-2">
                Total Revenue
              </h2>

              <p className="text-3xl font-bold text-green-400">
                ₱{totalRevenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-yellow-500/20">
              <h2 className="text-gray-400 text-sm mb-2">
                Paid Sales
              </h2>

              <p className="text-3xl font-bold text-yellow-400">
                {paidPurchases.length}
              </p>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-yellow-500/20">
              <h2 className="text-gray-400 text-sm mb-2">
                Credits Sold
              </h2>

              <p className="text-3xl font-bold text-yellow-400">
                💎 {totalCreditsSold.toLocaleString()}
              </p>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-yellow-500/20">
              <h2 className="text-gray-400 text-sm mb-2">
                Pending
              </h2>

              <p className="text-3xl font-bold text-blue-400">
                {pendingPurchases.length}
              </p>
            </div>

          </div>

          {/* Actions */}

          <div className="flex flex-wrap gap-3 mb-8">

            <button
              onClick={() => window.print()}
              className="bg-yellow-500 text-black px-5 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
            >
              🖨 Print Report
            </button>

            <button
              onClick={downloadCSV}
              className="bg-zinc-800 border border-zinc-700 px-5 py-3 rounded-xl font-bold hover:border-yellow-500 transition"
            >
              📥 Download CSV
            </button>

          </div>

          {/* Transactions */}

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">

            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-yellow-400">
                Purchase History
              </h2>
            </div>

            {loading ? (

              <div className="p-8 text-center text-gray-500">
                Loading financial records...
              </div>

            ) : purchases.length === 0 ? (

              <div className="p-8 text-center text-gray-500">
                No purchases yet.
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-zinc-800 text-gray-400">

                    <tr>
                      <th className="text-left px-5 py-4">
                        ID
                      </th>

                      <th className="text-left px-5 py-4">
                        Date
                      </th>

                      <th className="text-left px-5 py-4">
                        Credits
                      </th>

                      <th className="text-left px-5 py-4">
                        Amount
                      </th>

                      <th className="text-left px-5 py-4">
                        Provider
                      </th>

                      <th className="text-left px-5 py-4">
                        Reference
                      </th>

                      <th className="text-left px-5 py-4">
                        Status
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {purchases.map((purchase) => (

                      <tr
                        key={purchase.id}
                        className="border-t border-zinc-800 hover:bg-zinc-800/50"
                      >

                        <td className="px-5 py-4">
                          #{purchase.id}
                        </td>

                        <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                          {new Date(
                            purchase.created_at
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-yellow-400 font-bold">
                          💎 {purchase.credits}
                        </td>

                        <td className="px-5 py-4 font-bold">
                          ₱{purchase.peso_amount.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          {purchase.payment_provider ?? "—"}
                        </td>

                        <td className="px-5 py-4 text-gray-500 max-w-xs truncate">
                          {purchase.payment_reference ?? "—"}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              purchase.status === "paid"
                                ? "bg-green-500/20 text-green-400"
                                : purchase.status === "pending"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {purchase.status}
                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>
      </main>
    </CreatorGuard>
  );
}