import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // ==========================================
    // 1. Make sure the user is logged in
    // ==========================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. Read request
    // ==========================================

    const body = await request.json();

    const { credits, paymentCode, paymentMethod } = body;

    // ==========================================
    // 3. Validate credits
    // ==========================================

    if (![100, 300, 600, 1200].includes(credits)) {
      return NextResponse.json(
        {
          error: "Invalid credit package.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. Validate payment code
    // ==========================================

    if (
      !paymentCode ||
      typeof paymentCode !== "string" ||
      paymentCode.trim().length < 4
    ) {
      return NextResponse.json(
        {
          error: "A valid payment code is required.",
        },
        { status: 400 }
      );
    }
    if (
  !paymentMethod ||
  !["GCash", "Maya", "Coins.ph"].includes(paymentMethod)
) {
  return NextResponse.json(
    {
      error: "Please select a valid payment method.",
    },
    { status: 400 }
  );
}

    // ==========================================
    // 5. Create pending MANUAL payment
    //
    // IMPORTANT:
    // This uses manual_payments.
    //
    // It does NOT touch credit_purchases.
    // It does NOT add credits.
    // ==========================================

    const { data: payment, error } =
      await supabaseAdmin
        .from("manual_payments")
        .insert({
          user_id: user.id,
          payment_code: paymentCode.trim(),
          credits,
          peso_amount: credits,
          payment_provider: paymentMethod,
          payment_reference: null,
          status: "pending",
        })
        .select()
        .single();

    if (error || !payment) {
      console.error(
        "Manual payment creation error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not create payment request.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 6. Return result
    // ==========================================

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
    });
  } catch (error) {
    console.error(
      "Manual payment API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong creating the payment request.",
      },
      { status: 500 }
    );
  }
}