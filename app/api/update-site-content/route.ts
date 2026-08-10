import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { key, title, content } = await req.json();

  const { error } = await supabaseAdmin
    .from("site_content")
    .update({
      title,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}