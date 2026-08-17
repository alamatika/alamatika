import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { hasValidCreatorSession } from "../../../../lib/creatorSession";

export async function POST(req: Request) {
  try {
    /*
     * --------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------
     */

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let authorized = false;

    // Information about whoever performed the moderation action
    let actorId: string | null = null;
    let actorName = "Creator";

    /*
     * --------------------------------------------------
     * CHECK NORMAL ADMIN AUTHENTICATION
     * --------------------------------------------------
     */

    if (user) {
      const { data: profile, error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .select("is_admin, username, display_name")
          .eq("id", user.id)
          .single();

      if (!profileError && profile?.is_admin === true) {
        authorized = true;

        actorId = user.id;

        actorName =
          profile.display_name ||
          profile.username ||
          "Admin";
      }
    }

    /*
     * --------------------------------------------------
     * CHECK CREATOR AUTHENTICATION
     * --------------------------------------------------
     */

    if (!authorized && hasValidCreatorSession(req)) {
      authorized = true;

      actorId = null;
      actorName = "Creator";
    }

    /*
     * --------------------------------------------------
     * DENY UNAUTHORIZED REQUESTS
     * --------------------------------------------------
     */

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
     * GET COMMENT ID
     * --------------------------------------------------
     */

    const { commentId } = await req.json();

    if (!commentId) {
      return NextResponse.json(
        { error: "Missing commentId." },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * GET COMMENT OWNER
     * --------------------------------------------------
     *
     * We grab the user_id before deleting the comment
     * so the moderation log knows who owned it.
     */

    const { data: comment, error: commentFetchError } =
      await supabaseAdmin
        .from("comments")
        .select("user_id")
        .eq("id", commentId)
        .single();

    if (commentFetchError) {
      console.error(
        "Admin fetch comment error:",
        commentFetchError
      );

      return NextResponse.json(
        { error: commentFetchError.message },
        { status: 500 }
      );
    }

    const targetUserId = comment?.user_id ?? null;

    /*
     * --------------------------------------------------
     * DELETE COMMENT
     * --------------------------------------------------
     */

    const { error } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Admin delete comment error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * RESOLVE REPORTS
     * --------------------------------------------------
     */

    await supabaseAdmin
      .from("reports")
      .update({
        status: "resolved",
      })
      .eq("comment_id", commentId);

    /*
     * --------------------------------------------------
     * CREATE MODERATION LOG
     * --------------------------------------------------
     */

    const { error: logError } = await supabaseAdmin
      .from("admin_actions")
      .insert({
        actor_id: actorId,
        actor_name: actorName,
        action: "delete_comment",
        target_type: "comment",
        target_id: Number(commentId),
        target_user_id: targetUserId,
        reason: "Community moderation",
        details:
          "Community comment deleted by Admin or Creator.",
      });

    if (logError) {
      console.error("Moderation log error:", logError);
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error("Admin delete comment error:", error);

    return NextResponse.json(
      { error: "Server Error." },
      { status: 500 }
    );
  }
}