import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { commentId } = await req.json();

  const { error } = await supabaseAdmin
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("reports")
    .update({
      status: "resolved",
    })
    .eq("comment_id", commentId);

  return NextResponse.json({
    success: true,
  });
}