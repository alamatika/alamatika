"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/navbar";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabaseClient";

type Report = {
  id: number;
  created_at: string;
  reporter_id: string;
  post_id: number | null;
  comment_id: number | null;
  reason: string;
  status: string;
  preview?: string;
};

export default function CommunityModeration() {
  const [reports, setReports] = useState<Report[]>([]);

  async function loadReports() {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

   if (error) {
  alert(error.message);
  console.log(error);
  return;
}

    const reportsWithPreview = await Promise.all(
      (data ?? []).map(async (report) => {
        let preview = "";

        if (report.post_id) {
          const { data: post } = await supabase
            .from("community")
            .select("content")
            .eq("id", report.post_id)
            .single();

          preview = post?.content ?? "Post deleted.";
        }

        if (report.comment_id) {
          const { data: comment } = await supabase
            .from("comments")
            .select("content")
            .eq("id", report.comment_id)
            .single();

          preview = comment?.content ?? "Comment deleted.";
        }

        return {
          ...report,
          preview,
        };
      })
    );

    setReports(reportsWithPreview);
  }

  async function dismissReport(reportId: number) {
  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "dismissed",
    })
    .eq("id", reportId)
    .select();

  console.log("UPDATED:", data);
  console.log("ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  await loadReports();
}

 async function deleteContent(report: Report) {

  if (report.post_id) {
    const response = await fetch("/api/admin/delete-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId: report.post_id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error);
      return;
    }
  }

  if (report.comment_id) {
    const response = await fetch("/api/admin/delete-comment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commentId: report.comment_id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error);
      return;
    }
  }

  await supabase
    .from("reports")
    .update({
      status: "resolved",
    })
    .eq("id", report.id);

  await loadReports();
}

  useEffect(() => {
    const init = async () => {
    await loadReports();
    };
    init();
  }, []);

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="max-w-7xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">
          <h1 className="text-5xl font-bold text-red-400 mb-12">
            🚩 Community Moderation
          </h1>

          <div className="space-y-5">
            {reports.length === 0 && (
              <div className="bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-700">
                🎉 No pending reports.
              </div>
            )}

            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-zinc-900 rounded-2xl border border-red-500 p-6"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-yellow-400">
                      {report.post_id
                        ? "📢 Community Post"
                        : "💬 Comment"}
                    </h2>

                    <p className="text-gray-400 mt-2">
                      Reason: {report.reason}
                    </p>

                    <div className="mt-4 bg-zinc-800 rounded-xl p-4 italic text-gray-300">
                      {report.preview}
                    </div>

                    <p className="text-gray-500 text-sm mt-4">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="md:ml-8 text-left md:text-right">
                    <span className="bg-red-600 rounded-full px-4 py-2 font-bold">
                      {report.status}
                    </span>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <button
  onClick={() => {
    console.log("Dismiss clicked!", report.id);
    dismissReport(report.id);
  }}
  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 font-bold"
>
  ✅ Dismiss
</button>

                      <button
                        onClick={() => deleteContent(report)}
                        className="w-40 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold"
                      >
                        🗑 Delete Content
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AdminGuard>
  );
}