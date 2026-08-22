import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // Check creator session
    const cookieHeader = request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find(
        (item) =>
          item.startsWith("alamatika_creator_session=")
      );

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Creator authentication required." },
        { status: 401 }
      );
    }

    const token = sessionCookie.substring(
      "alamatika_creator_session=".length
    );

    // Verify the creator session using the same secret
    const crypto = await import("node:crypto");

    const secret = process.env.CREATOR_SESSION_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Creator session is not configured." },
        { status: 500 }
      );
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid creator session." },
        { status: 401 }
      );
    }

    const [timestamp, signature] = parts;

    const tokenTime = Number(timestamp);

    if (!Number.isFinite(tokenTime)) {
      return NextResponse.json(
        { error: "Invalid creator session." },
        { status: 401 }
      );
    }

    const maxAge = 60 * 60 * 8 * 1000;

    if (Date.now() - tokenTime > maxAge) {
      return NextResponse.json(
        { error: "Creator session expired." },
        { status: 401 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(timestamp)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return NextResponse.json(
        { error: "Invalid creator session." },
        { status: 401 }
      );
    }

    // Read purchase ID
    const { purchaseId } = await request.json();

    const numericPurchaseId = Number(purchaseId);

    if (
      !Number.isSafeInteger(numericPurchaseId) ||
      numericPurchaseId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid purchase ID." },
        { status: 400 }
      );
    }

    // Supabase admin client
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Database configuration is missing." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Make sure this is actually a manual pending payment.
    const { data: purchase, error: purchaseError } =
      await supabaseAdmin
        .from("credit_purchases")
        .select(
          "id, user_id, credits, peso_amount, payment_code, payment_provider, status"
        )
        .eq("id", numericPurchaseId)
        .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: "Payment request not found." },
        { status: 404 }
      );
    }

    if (purchase.payment_provider !== "Manual") {
      return NextResponse.json(
        { error: "This is not a manual payment." },
        { status: 400 }
      );
    }

    if (purchase.status === "paid") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        purchaseId: purchase.id,
        creditsAdded: 0,
      });
    }

    if (purchase.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "This payment is no longer pending.",
        },
        { status: 400 }
      );
    }

    // Complete the purchase.
    const { data, error } =
      await supabaseAdmin.rpc(
        "complete_credit_purchase",
        {
          p_purchase_id: numericPurchaseId,
        }
      );

    if (error) {
      console.error(
        "Could not approve manual payment:",
        error
      );

      return NextResponse.json(
        { error: "Could not approve payment." },
        { status: 500 }
      );
    }

    const result = data?.[0];

    // Record creator approval time and creator identifier.
    //
    // For now we store the creator username if available.
    // approved_by is currently a timestamptz column, so we
    // only store the approval time there.
    const { error: approvalError } =
      await supabaseAdmin
        .from("credit_purchases")
        .update({
          approved_at: new Date().toISOString(),
        })
        .eq("id", numericPurchaseId);

    if (approvalError) {
      console.error(
        "Could not record approval time:",
        approvalError
      );
    }

    return NextResponse.json({
      success: true,
      purchaseId:
        result?.purchase_id ?? numericPurchaseId,
      creditsAdded:
        result?.credits_added ?? 0,
      alreadyProcessed:
        result?.already_processed ?? false,
    });
  } catch (error) {
    console.error(
      "Manual payment approval error:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong approving payment." },
      { status: 500 }
    );
  }
}