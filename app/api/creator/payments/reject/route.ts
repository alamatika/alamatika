import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function verifySessionToken(token: string) {
  const secret = process.env.CREATOR_SESSION_SECRET;

  if (!secret) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [timestamp, signature] = parts;

  const tokenTime = Number(timestamp);

  if (!Number.isFinite(tokenTime)) {
    return false;
  }

  const maxAge = 60 * 60 * 8 * 1000;

  if (Date.now() - tokenTime > maxAge) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

function getCreatorSession(request: Request) {
  const cookieHeader =
    request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find(
      (item) =>
        item.startsWith(
          "alamatika_creator_session="
        )
    );

  if (!sessionCookie) {
    return null;
  }

  return sessionCookie.substring(
    "alamatika_creator_session=".length
  );
}

export async function POST(request: Request) {
  try {
    // ==========================================
    // 1. Verify Creator session
    // ==========================================

    const token = getCreatorSession(request);

    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        {
          error:
            "Creator authentication required.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. Read payment ID
    // ==========================================

    const body = await request.json();

    const paymentId = Number(body.paymentId);

    if (
      !Number.isSafeInteger(paymentId) ||
      paymentId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid payment ID.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. Supabase server client
    // ==========================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Supabase server configuration is missing."
      );

      return NextResponse.json(
        {
          error:
            "Server database configuration is missing.",
        },
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

    // ==========================================
    // 4. Reject through secure database function
    // ==========================================

    const { data, error } =
      await supabaseAdmin.rpc(
        "reject_manual_payment",
        {
          p_payment_id: paymentId,
          p_rejected_by: "creator",
        }
      );

    if (error) {
      console.error(
        "Manual payment rejection error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Could not reject payment.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 5. Return result
    // ==========================================

    const result = data?.[0];

    return NextResponse.json({
      success: true,

      paymentId:
        result?.payment_id ?? paymentId,

      alreadyProcessed:
        result?.already_processed ?? false,
    });
  } catch (error) {
    console.error(
      "Manual payment rejection error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong rejecting the payment.",
      },
      { status: 500 }
    );
  }
}