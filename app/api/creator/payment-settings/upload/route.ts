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

export async function POST(request: Request) {
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
    // 2. Supabase configuration
    // ==========================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
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
    // 3. Read uploaded file
    // ==========================================

    const formData = await request.formData();

    const file = formData.get("file");
    const paymentMethod =
      formData.get("paymentMethod");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please select an image.",
        },
        { status: 400 }
      );
    }

    if (
      typeof paymentMethod !== "string" ||
      !paymentMethod.trim()
    ) {
      return NextResponse.json(
        {
          error: "Payment method is required.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. Validate image
    // ==========================================

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Only PNG, JPG, and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            "Image must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 5. Create unique filename
    // ==========================================

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const safePaymentMethod =
      paymentMethod
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

    const fileName =
      `${safePaymentMethod}-${Date.now()}-${crypto
        .randomBytes(6)
        .toString("hex")}.${extension}`;

    const filePath = `qr/${fileName}`;

    // ==========================================
    // 6. Convert File to Buffer
    // ==========================================

    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    // ==========================================
    // 7. Upload to payment-qr bucket
    // ==========================================

    const { error: uploadError } =
      await supabaseAdmin.storage
        .from("payment-qr")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error(
        "QR upload error:",
        uploadError
      );

      return NextResponse.json(
        {
          error:
            "Could not upload QR image.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 8. Get public URL
    // ==========================================

    const { data: publicUrlData } =
      supabaseAdmin.storage
        .from("payment-qr")
        .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        {
          error:
            "Could not create QR image URL.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 9. Return URL
    // ==========================================

    return NextResponse.json({
      success: true,
      qr_url: publicUrlData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error(
      "Payment QR upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong uploading the QR image.",
      },
      { status: 500 }
    );
  }
}