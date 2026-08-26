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

  const maxAge =
    60 * 60 * 8 * 1000;

  if (
    Date.now() - tokenTime > maxAge
  ) {
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

export async function POST(request: Request) {
  if (!verifyCreatorSession(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const path =
      typeof body.path === "string"
        ? body.path.trim()
        : "";

    if (!path) {
      return NextResponse.json(
        { error: "Missing file path." },
        { status: 400 }
      );
    }

    // Prevent unexpected paths or traversal attempts.
    if (
      path.startsWith("/") ||
      path.includes("..") ||
      path.includes("\\")
    ) {
      return NextResponse.json(
        { error: "Invalid file path." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data,
      error,
    } = await supabase.storage
      .from("premium-pages")
      .createSignedUrl(
        path,
        60 * 10
      );

    if (error || !data?.signedUrl) {
      console.error(
        "Premium page preview URL error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not create preview URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error(
      "Premium page preview error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Invalid request.",
      },
      { status: 400 }
    );
  }
}