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
    const formData =
      await request.formData();

    const file = formData.get("file");
    const chapterNumber =
      String(
        formData.get("chapterNumber") ||
          "new"
      );
    const pageNumber =
      Number(
        formData.get("pageNumber") || 1
      );

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      return NextResponse.json(
        {
          error:
            "Only JPG, PNG, and WEBP files are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "Image must be 10 MB or smaller.",
        },
        { status: 400 }
      );
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const safeName =
      `chapter-${chapterNumber}-page-${String(
        pageNumber
      ).padStart(2, "0")}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

    const bytes =
      await file.arrayBuffer();

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

    const { error } =
      await supabase.storage
        .from("premium-pages")
        .upload(
          safeName,
          Buffer.from(bytes),
          {
            contentType: file.type,
            upsert: false,
          }
        );

    if (error) {
      console.error(
        "Premium page upload error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to upload premium page.",
        },
        { status: 500 }
      );
    }

    const {
      data: signedData,
      error: signedError,
    } =
      await supabase.storage
        .from("premium-pages")
        .createSignedUrl(
          safeName,
          60 * 10
        );

    if (signedError) {
      console.error(
        "Premium preview URL error:",
        signedError
      );

      await supabase.storage
        .from("premium-pages")
        .remove([safeName]);

      return NextResponse.json(
        {
          error:
            "Failed to create preview URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      path: safeName,
      previewUrl:
        signedData.signedUrl,
    });

  } catch (error) {
    console.error(
      "Premium page upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to process upload.",
      },
      { status: 500 }
    );
  }
}