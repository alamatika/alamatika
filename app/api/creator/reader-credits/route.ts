import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function verifyCreatorSession(request: Request) {
  const cookieHeader =
    request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) =>
      item.startsWith(
        "alamatika_creator_session="
      )
    );

  if (!sessionCookie) {
    return false;
  }

  const token = sessionCookie.substring(
    "alamatika_creator_session=".length
  );

  const secret =
    process.env.CREATOR_SESSION_SECRET;

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

  const expectedSignature =
    crypto
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

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function GET(request: Request) {
  if (!verifyCreatorSession(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const query =
    url.searchParams.get("q")?.trim() || "";

  const userId =
    url.searchParams.get("userId") || "";

  const supabase = getAdminSupabase();

  const showAll =
  url.searchParams.get("all") === "true";

const page = Math.max(
  Number(
    url.searchParams.get("page") || "1"
  ),
  1
);

const limit = Math.min(
  Math.max(
    Number(
      url.searchParams.get("limit") || "10"
    ),
    1
  ),
  50
);

  // Load grant history for a selected reader.

  if (userId) {
    const { data, error } = await supabase
      .from("credit_grants")
      .select(
        "id, credits, reason, note, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (error) {
      console.error(
        "Credit history error:",
        error
      );

      return NextResponse.json(
        { error: "Failed to load credit history." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: data ?? [],
    });
  }

  if (showAll) {
  const from =
    (page - 1) * limit;

  const to =
    from + limit - 1;

  const {
    data: readers,
    count,
    error,
  } = await supabase
    .from("profiles")
    .select(
      "id, username, email, display_name, credits",
      { count: "exact" }
    )
    .eq("is_admin", false)
    .order("username", {
      ascending: true,
    })
    .range(from, to);

  if (error) {
    console.error(
      "Load all readers error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load readers.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    readers: readers ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

  if (query.length < 2) {
    return NextResponse.json({
      readers: [],
    });
  }

  const [
    { data: usernameMatches },
    { data: emailMatches },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, username, email, display_name, credits"
      )
      .ilike("username", `%${query}%`)
      .limit(20),

    supabase
      .from("profiles")
      .select(
        "id, username, email, display_name, credits"
      )
      .ilike("email", `%${query}%`)
      .limit(20),
  ]);

  const combined = [
    ...(usernameMatches ?? []),
    ...(emailMatches ?? []),
  ];

  const uniqueReaders = Array.from(
    new Map(
      combined.map((reader) => [
        reader.id,
        reader,
      ])
    ).values()
  ).slice(0, 20);

  return NextResponse.json({
    readers: uniqueReaders,
  });
}

export async function POST(request: Request) {
  if (!verifyCreatorSession(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const grantToAll = body.grantToAll === true;

    if (grantToAll) {
  const credits = Number(body.credits);

  const reason = String(
    body.reason || ""
  ).trim();

  const note = String(
    body.note || ""
  ).trim();

  if (
    !Number.isInteger(credits) ||
    credits <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Credits must be a positive whole number.",
      },
      { status: 400 }
    );
  }

  if (!reason) {
    return NextResponse.json(
      {
        error: "A reason is required.",
      },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();

  const { data, error } =
    await supabase.rpc(
      "grant_creator_credits_to_all_readers",
      {
        p_credits: credits,
        p_reason: reason,
        p_note: note || null,
      }
    );

  if (error) {
    console.error(
      "Bulk credit grant error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to give credits to readers.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    affectedReaders: data ?? 0,
  });
}

    const userId = String(
      body.userId || ""
    ).trim();

    const credits = Number(body.credits);

    const reason = String(
      body.reason || ""
    ).trim();

    const note = String(
      body.note || ""
    ).trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Reader account is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(credits) ||
      credits <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Credits must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "A reason is required." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { data: newBalance, error } =
      await supabase.rpc(
        "grant_creator_credits",
        {
          p_user_id: userId,
          p_credits: credits,
          p_reason: reason,
          p_note: note || null,
        }
      );

    if (error) {
      console.error(
        "Grant credits error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}