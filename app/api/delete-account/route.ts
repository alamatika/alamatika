import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";

export async function POST() {
  try {
    // Verify logged in user
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Not logged in.",
        },
        { status: 401 }
      );
    }

    // Admin client
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const uid = user.id;

    // -------------------------
    // DELETE USER DATA
    // -------------------------

    await admin.from("chapter_unlocks").delete().eq("user_id", uid);

    await admin.from("chapter_comments").delete().eq("user_id", uid);

    await admin.from("chapter_ratings").delete().eq("user_id", uid);

    await admin.from("chapter_bookmarks").delete().eq("user_id", uid);

    await admin.from("bookmarks").delete().eq("user_id", uid);

    await admin.from("credit_transactions").delete().eq("user_id", uid);

    await admin.from("credit_purchases").delete().eq("user_id", uid);

    await admin.from("creator_messages").delete().eq("user_id", uid);

    await admin
      .from("creator_conversations")
      .delete()
      .eq("user_id", uid);

    await admin.from("community_likes").delete().eq("user_id", uid);

    await admin.from("comments").delete().eq("user_id", uid);

    await admin.from("community").delete().eq("user_id", uid);

    await admin.from("notifications").delete().eq("user_id", uid);

    await admin.from("reader_stats").delete().eq("user_id", uid);

    await admin.from("reports").delete().eq("user_id", uid);

    await admin.from("followers").delete().eq("follower_id", uid);

    await admin.from("followers").delete().eq("following_id", uid);

    await admin.from("profiles").delete().eq("id", uid);

    // -------------------------
    // DELETE AUTH ACCOUNT
    // -------------------------

    const { error } = await admin.auth.admin.deleteUser(uid);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}