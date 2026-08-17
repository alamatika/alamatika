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
     * GET POST ID
     * --------------------------------------------------
     */

    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Missing postId." },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * DELETE POST
     * --------------------------------------------------
     */

    const { error } = await supabaseAdmin
      .from("community")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Admin delete post error:", error);

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
      .eq("post_id", postId);

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
        action: "delete_post",
        target_type: "post",
        target_id: Number(postId),
        target_user_id: null,
        reason: "Community moderation",
        details: "Community post deleted by Admin or Creator.",
      });

    if (logError) {
      console.error("Moderation log error:", logError);
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error("Admin delete post error:", error);

    return NextResponse.json(
      { error: "Server Error." },
      { status: 500 }
    );
  }
}