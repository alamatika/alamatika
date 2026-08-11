import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { chapterId } = await request.json();

    if (!chapterId) {
      return NextResponse.json(
        { error: "Chapter ID is required." },
        { status: 400 }
      );
    }

    // Check the user's profile and current credits.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    // Check if the chapter is already unlocked.
    const { data: existingUnlock } = await supabase
      .from("chapter_unlocks")
      .select("id")
      .eq("user_id", user.id)
      .eq("chapter_id", chapterId)
      .maybeSingle();

    if (existingUnlock) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
      });
    }

    // Every premium chapter currently costs 25 Credits.
    const cost = 25;

    if (profile.credits < cost) {
      return NextResponse.json(
        {
          error: "Not enough Credits.",
          credits: profile.credits,
          required: cost,
        },
        { status: 400 }
      );
    }

    // Deduct the Credits.
    const { error: creditError } = await supabase
      .from("profiles")
      .update({
        credits: profile.credits - cost,
      })
      .eq("id", user.id);

    if (creditError) {
      console.error("Credit deduction error:", creditError);

      return NextResponse.json(
        { error: "Could not deduct Credits." },
        { status: 500 }
      );
    }

    // Create the chapter unlock.
    const { error: unlockError } = await supabase
      .from("chapter_unlocks")
      .insert({
        user_id: user.id,
        chapter_id: chapterId,
      });

    if (unlockError) {
      console.error("Chapter unlock error:", unlockError);

      // Restore the Credits if creating the unlock failed.
      await supabase
        .from("profiles")
        .update({
          credits: profile.credits,
        })
        .eq("id", user.id);

      return NextResponse.json(
        { error: "Could not unlock the chapter." },
        { status: 500 }
      );
    }

    // Record the wallet transaction.
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -cost,
        type: "unlock",
        description: "Unlocked a chapter",
      });

    if (transactionError) {
      console.error(
        "Transaction record error:",
        transactionError
      );
    }

    return NextResponse.json({
      success: true,
      credits: profile.credits - cost,
    });
  } catch (error) {
    console.error("Chapter unlock error:", error);

    return NextResponse.json(
      { error: "Something went wrong unlocking the chapter." },
      { status: 500 }
    );
  }
}