import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

type Purchase = {
  id: number;
  created_at: string;
  payment_code: string | null;
  credits: number;
  peso_amount: number;
  payment_provider: string | null;
  status: string;
  expires_at: string | null;
  approved_at: string | null;
};

let paymongoPurchases: Purchase[] = [];

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // ==========================================
    // 1. Get logged-in user
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
    // 2. Get MANUAL purchases
    // ==========================================

    const {
  data: manualPurchases,
  error: manualError,
} = await supabaseAdmin
  .from("manual_payments")
      .select(`
        id,
        created_at,
        payment_code,
        credits,
        peso_amount,
        payment_provider,
        status,
        expires_at,
        approved_at
      `)
      .eq("user_id", user.id);

    if (manualError) {
      console.error(
        "Could not load manual purchases:",
        manualError
      );

      return NextResponse.json(
        {
          error:
            "Could not load manual purchase history.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 3. Get PAYMONGO purchases
    //
    // This is intentionally optional.
    // A PayMongo history problem must NOT
    // prevent manual history from appearing.
    // ==========================================

    

    const {
      data: paymongoData,
      error: paymongoError,
    } = await supabase
      .from("credit_purchases")
      .select(`
        id,
        created_at,
        payment_code,
        credits,
        peso_amount,
        payment_provider,
        status,
        expires_at,
        approved_at
      `)
      .eq("user_id", user.id);

    if (paymongoError) {
      console.error(
        "PayMongo purchase history unavailable:",
        paymongoError
      );

      // Do NOT fail the entire request.
      paymongoPurchases = [];
    } else {
      paymongoPurchases = paymongoData ?? [];
    }

    // ==========================================
    // 4. Combine both histories
    // ==========================================

    const purchases = [
      ...(manualPurchases ?? []),
      ...paymongoPurchases,
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    // ==========================================
    // 5. Return combined history
    // ==========================================

    return NextResponse.json({
      purchases,
    });

  } catch (error) {
    console.error(
      "Profile purchases API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong loading purchase history.",
      },
      { status: 500 }
    );
  }
}