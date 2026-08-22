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

    const { credits, redirect } = await request.json();


    const normalPackages = [1, 100, 300, 600, 1200];

const validPackage = normalPackages.includes(credits);

if (!validPackage) {
  return NextResponse.json(
    { error: "Invalid credit package." },
    { status: 400 }
  );
}


    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYMONGO_SECRET_KEY is missing.");

      return NextResponse.json(
        { error: "Payment system is not configured." },
        { status: 500 }
      );
    }

    // Create our own pending purchase first.
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("credit_purchases")
      .insert({
        user_id: user.id,
        credits,
        peso_amount: credits,
        payment_provider: "PayMongo",
        status: "pending",
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error(purchaseError);

      return NextResponse.json(
        { error: "Could not create purchase record." },
        { status: 500 }
      );
    }

    const authHeader = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [
                {
                  currency: "PHP",
                  amount: credits * 100,
                  description: `${credits} Alamatika Credits`,
                  name: `${credits} Credits`,
                  quantity: 1,
                },
              ],

              payment_method_types: ["qrph"],

              description: `Alamatika Credit Purchase #${purchase.id}`,
              reference_number: `ALAMATIKA-${purchase.id}`,

              success_url:
  `${process.env.NEXT_PUBLIC_SITE_URL}/wallet?payment=success&purchase=${purchase.id}${
    redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
  }`,

              cancel_url:
  `${process.env.NEXT_PUBLIC_SITE_URL}/wallet?payment=cancelled&purchase=${purchase.id}${
    redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
  }`,
            },
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", result);

      // Remove the pending purchase if PayMongo failed.
      await supabaseAdmin
        .from("credit_purchases")
        .delete()
        .eq("id", purchase.id);

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.detail ??
            "PayMongo could not create the checkout.",
        },
        { status: 500 }
      );
    }

    const checkoutSessionId = result?.data?.id;
    const checkoutUrl = result?.data?.attributes?.checkout_url;

    if (!checkoutSessionId || !checkoutUrl) {
      console.error("Unexpected PayMongo response:", result);

      return NextResponse.json(
        { error: "PayMongo returned an invalid checkout response." },
        { status: 500 }
      );
    }

    // Store PayMongo's checkout-session ID.
    const { error: updateError } = await supabaseAdmin
      .from("credit_purchases")
      .update({
        payment_reference: checkoutSessionId,
      })
      .eq("id", purchase.id);

    if (updateError) {
      console.error(updateError);
    }

    return NextResponse.json({
      checkoutUrl,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    return NextResponse.json(
      { error: "Something went wrong creating the payment." },
      { status: 500 }
    );
  }
}