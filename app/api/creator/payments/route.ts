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
  const cookieHeader = request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find(
      (item) =>
        item.startsWith("alamatika_creator_session=")
    );

  if (!sessionCookie) {
    return null;
  }

  return sessionCookie.substring(
    "alamatika_creator_session=".length
  );
}

export async function GET(request: Request) {
  try {
    // ==========================================
    // 1. Verify Creator session
    // ==========================================

    const token = getCreatorSession(request);

    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        {
          error: "Creator authentication required.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. Supabase server client
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
    // 3. Get ALL manual payments
    // ==========================================

    const {
      data: payments,
      error: paymentsError,
    } = await supabaseAdmin
      .from("manual_payments")
      .select(`
        id,
        created_at,
        user_id,
        payment_code,
        credits,
        peso_amount,
        payment_provider,
        payment_reference,
        status,
        expires_at,
        approved_at,
        approved_by
      `)
      .order("created_at", {
        ascending: false,
      });

    if (paymentsError) {
      console.error(
        "Could not fetch manual payments:",
        paymentsError
      );

      return NextResponse.json(
        {
          error:
            "Could not load manual payments.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 4. Get user profiles
    // ==========================================

    const userIds = [
      ...new Set(
        (payments ?? [])
          .map((payment) => payment.user_id)
          .filter(Boolean)
      ),
    ];

    let profiles: {
      id: string;
      username: string | null;
      display_name: string | null;
      email: string | null;
    }[] = [];

    if (userIds.length > 0) {
      const {
        data: profileData,
        error: profilesError,
      } = await supabaseAdmin
        .from("profiles")
        .select(`
          id,
          username,
          display_name,
          email
        `)
        .in("id", userIds);

      if (profilesError) {
        console.error(
          "Could not fetch payment profiles:",
          profilesError
        );

        return NextResponse.json(
          {
            error:
              "Could not load payment user information.",
          },
          { status: 500 }
        );
      }

      profiles = profileData ?? [];
    }

    // ==========================================
    // 5. Attach profiles to payments
    // ==========================================

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const result = (payments ?? []).map(
      (payment) => ({
        ...payment,
        profiles:
          profileMap.get(payment.user_id) ?? null,
      })
    );

    // ==========================================
    // 6. Separate pending / approved
    // ==========================================

    const pendingPayments = result.filter(
      (payment) =>
        payment.status === "pending"
    );

    const approvedPayments = result.filter(
      (payment) =>
        payment.status === "approved"
    );

    const rejectedPayments = result.filter(
  (payment) =>
    payment.status === "rejected"
);

    // ==========================================
    // 7. Return both lists
    // ==========================================

    return NextResponse.json({
  pendingPayments,
  approvedPayments,
  rejectedPayments,

  payments: pendingPayments,
});

  } catch (error) {
    console.error(
      "Creator payments GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong loading payments.",
      },
      { status: 500 }
    );
  }
}