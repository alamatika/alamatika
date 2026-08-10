"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/navbar";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

type Purchase = {
  amount: number;
  chapter_id: number;
  created_at: string;
};

export default function IncomeReport() {
  const [revenue, setRevenue] = useState(0);
  const [sales, setSales] = useState(0);

  useEffect(() => {
    async function loadIncome() {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("payment_status", "paid");

      if (error) {
        console.error(error);
        return;
      }

      const purchases = (data as Purchase[]) ?? [];

      setSales(purchases.length);

      const totalRevenue = purchases.reduce(
        (sum, purchase) => sum + (purchase.amount ?? 0),
        0
      );

      setRevenue(totalRevenue);
    }

    loadIncome();
  }, []);

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-32 px-6">
          <Link
  href="/admin"
  className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
>
  🏠 Creator Studio
</Link>

          <h1 className="text-5xl font-bold text-yellow-400 mb-12">
            💰 Income Report
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-zinc-900 rounded-2xl p-8 border border-yellow-500/20">
              <h2 className="text-gray-400 mb-3">
                Total Revenue
              </h2>

              <p className="text-5xl font-bold text-green-400">
                ₱{revenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-8 border border-yellow-500/20">
              <h2 className="text-gray-400 mb-3">
                Total Sales
              </h2>

              <p className="text-5xl font-bold text-yellow-400">
                {sales}
              </p>
            </div>

          </div>

          <button
            onClick={() => window.print()}
            className="mt-10 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400"
          >
            🖨 Print Report
          </button>

<section className="max-w-6xl mx-auto pt-32 px-6"></section>

        </section>
        
      </main>
    </AdminGuard>
  );
}