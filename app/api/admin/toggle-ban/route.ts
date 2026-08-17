import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { hasValidCreatorSession } from "../../../../lib/creatorSession";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let authorized = false;
    let actorId: string | null = null;
    let actorName = "Creator";

    /*
     * --------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------
     *
     * Allow:
     *
     * 1. Logged-in Admin
     * 2. Authenticated Creator
     */

    // Normal Admin authentication
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_admin, username")
        .eq("id", user.id)
        .single();

      if (profile?.is_admin === true) {
        authorized = true;
        actorId = user.id;
        actorName = profile.username;
      }
    }

    // Creator authentication
    if (!authorized && hasValidCreatorSession(req)) {
      authorized = true;
      actorName = "Creator";
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error: "Unauthorized. Admin or Creator access required.",
        },
        { status: 403 }
      );
    }

    /*
     * --------------------------------------------------
     * REQUEST
     * --------------------------------------------------
     */

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId." },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * GET TARGET USER
     * --------------------------------------------------
     */

    const { data: targetUser, error: targetError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, username, banned, is_admin")
        .eq("id", userId)
        .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    /*
     * --------------------------------------------------
     * PREVENT SELF-BAN
     * --------------------------------------------------
     */

    if (actorId && targetUser.id === actorId) {
      return NextResponse.json(
        { error: "You cannot ban yourself." },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * TOGGLE BAN STATUS
     * --------------------------------------------------
     */

    const newBanStatus = !targetUser.banned;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        banned: newBanStatus,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Toggle ban error:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * LOG ACTION
     * --------------------------------------------------
     */

    const { error: logError } = await supabaseAdmin
  .from("admin_actions")
  .insert({
    actor_id: actorId,
    actor_name: actorName,
    action: newBanStatus
      ? "ban_user"
      : "unban_user",
    target_type: "user",
    target_id: null,
    target_user_id: userId,
    reason: newBanStatus
      ? "User banned"
      : "User unbanned",
    details: {
      username: targetUser.username,
    },
  });

if (logError) {
  console.error("Admin action log error:", logError);

  return NextResponse.json(
    {
      error: `Ban status changed, but action could not be logged: ${logError.message}`,
    },
    { status: 500 }
  );
}

    return NextResponse.json({
      success: true,
      banned: newBanStatus,
    });

  } catch (error) {
    console.error("Toggle ban server error:", error);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}