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
    Date.now() - tokenTime >
    maxAge
  ) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
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

export async function GET(
  request: Request
) {
  if (!verifyCreatorSession(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(
    request.url
  );

  const path =
    url.searchParams.get("path") || "";

  if (
    !path ||
    path.includes("..") ||
    path.startsWith("/")
  ) {
    return NextResponse.json(
      { error: "Invalid attachment path." },
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
    .from("chat-attachments")
    .createSignedUrl(
      path,
      60 * 10
    );

  if (error || !data?.signedUrl) {
    console.error(
      "Signed attachment error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Attachment could not be loaded.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    url: data.signedUrl,
  });
}