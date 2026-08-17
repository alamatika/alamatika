"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";

type Action = {
  id: number;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: number | string | null;
  target_user_id: string | null;
  reason: string | null;
  details: string | Record<string, unknown> | null;
};

export default function CreatorModerationHistory() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function loadActions() {
    try {
      console.log("Loading moderation history...");

      const response = await fetch(
        "/api/creator/moderation-history"
      );

      console.log("API response:", response.status);

      const result = await response.json();

      console.log("Moderation history result:", result);

      if (!response.ok) {
        console.error(
          "Error loading moderation history:",
          result.error
        );

        alert(result.error);
        setLoading(false);
        return;
      }

      setActions(result.actions ?? []);
      setLoading(false);

    } catch (error) {
      console.error(
        "Error loading moderation history:",
        error
      );

      alert("Failed to load moderation history.");
      setLoading(false);
    }
  }

  loadActions();
}, []);

  function getActionLabel(action: string) {
    switch (action) {
      case "ban_user":
        return "🔴 User Banned";

      case "unban_user":
        return "🟢 User Unbanned";

      case "delete_post":
        return "🗑️ Post Deleted";

      case "delete_comment":
        return "🗑️ Comment Deleted";

      default:
        return action;
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case "ban_user":
        return "border-red-500";

      case "unban_user":
        return "border-green-500";

      case "delete_post":
      case "delete_comment":
        return "border-orange-500";

      default:
        return "border-zinc-700";
    }
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-7xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          <Link
            href="/creator"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
          >
            🏠 Creator Studio
          </Link>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400">
            🛡️ Moderation History
          </h1>

          <p className="text-gray-400 mt-3">
            Review moderation actions performed by Admins and the Creator.
          </p>

          {loading ? (
            <div className="mt-12 text-gray-400">
              Loading moderation history...
            </div>
          ) : actions.length === 0 ? (
            <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center text-gray-400">
              No moderation actions yet.
            </div>
          ) : (
            <div className="mt-12 space-y-5">

              {actions.map((item) => (
                <div
                  key={item.id}
                  className={`bg-zinc-900 border ${getActionColor(
                    item.action
                  )} rounded-2xl p-5 sm:p-6`}
                >

                  <div className="flex flex-col lg:flex-row lg:justify-between gap-6">

                    {/* ACTION */}

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h2 className="text-xl sm:text-2xl font-bold">
                          {getActionLabel(item.action)}
                        </h2>

                        <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full text-gray-400">
                          {item.target_type ?? "unknown"}
                        </span>

                      </div>

                      {/* ACTOR */}

                      <div className="mt-5">

                        <p className="text-gray-500 text-sm">
                          Action performed by
                        </p>

                        <p className="text-yellow-400 font-bold">
                          {item.actor_name ?? "Unknown"}
                        </p>

                      </div>

                      {/* TARGET */}

                      <div className="mt-4">

                        <p className="text-gray-500 text-sm">
                          Target
                        </p>

                        <p className="font-semibold">
                          {typeof item.details === "object" &&
                           item.details !== null &&
                           "username" in item.details
                           ? String(item.details.username)
                           : item.target_id ?? "Unknown"}
                        </p>

                      </div>

                      {/* REASON */}

                      {item.reason && (
                        <div className="mt-4">

                          <p className="text-gray-500 text-sm">
                            Reason
                          </p>

                          <p className="text-gray-300">
                            {item.reason}
                          </p>

                        </div>
                      )}

                    </div>

                    {/* DATE / DETAILS */}

                    <div className="lg:w-64">

                      <p className="text-gray-500 text-sm">
                        Date
                      </p>

                      <p className="text-gray-300">
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </p>

                      {item.details && (
                        <div className="mt-5">

                          <p className="text-gray-500 text-sm mb-2">
                            Details
                          </p>

                          <pre className="text-xs text-gray-400 bg-black rounded-xl p-3 overflow-auto">
                            {JSON.stringify(
                              item.details,
                              null,
                              2
                            )}
                          </pre>

                        </div>
                      )}

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

          <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
            © Alamatika. All Rights Reserved.
            <br />
            Version 1.0.0
          </footer>

        </section>
      </main>
    </CreatorGuard>
  );
}