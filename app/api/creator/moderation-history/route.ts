import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { hasValidCreatorSession } from "../../../../lib/creatorSession";

export async function GET(req: Request) {
  try {
    // --------------------------------------------------
    // CREATOR AUTHENTICATION
    // --------------------------------------------------

    if (!hasValidCreatorSession(req)) {
      return NextResponse.json(
        { error: "Creator access required." },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // LOAD MODERATION HISTORY
    // --------------------------------------------------

    const { data, error } = await supabaseAdmin
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Creator moderation history error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      actions: data ?? [],
    });

  } catch (error) {
    console.error(
      "Creator moderation history server error:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}