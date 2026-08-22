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

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/* =========================================================
   GET
   Load payment settings
========================================================= */

export async function GET(request: Request) {
  try {
    const token = getCreatorSession(request);

    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        {
          error: "Creator authentication required.",
        },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Server database configuration is missing.",
        },
        { status: 500 }
      );
    }

    const { data: settings, error } =
      await supabaseAdmin
        .from("payment_settings")
        .select(`
          id,
          payment_method,
          qr_url,
          account_name,
          account_number,
          updated_at
        `)
        .order("id", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Could not load payment settings:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not load payment settings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: settings ?? [],
    });
  } catch (error) {
    console.error(
      "Payment settings GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong loading payment settings.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   Upload QR image
========================================================= */

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
    // 2. Supabase admin client
    // ==========================================

    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Server database configuration is missing.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 3. Read uploaded file
    // ==========================================

    const formData = await request.formData();

    const file = formData.get("file");
    const paymentMethodValue =
      formData.get("payment_method");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No QR image was provided.",
        },
        { status: 400 }
      );
    }

    const paymentMethod =
      typeof paymentMethodValue === "string"
        ? paymentMethodValue.trim()
        : "";

    if (!paymentMethod) {
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
            "Please upload a PNG, JPG, or WEBP image.",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            "QR image must be 5 MB or smaller.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 5. Create safe file name
    // ==========================================

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const safePaymentMethod =
      paymentMethod
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const fileName = `${safePaymentMethod}-${Date.now()}.${extension}`;

    const filePath = `qr/${fileName}`;

    // ==========================================
    // 6. Convert file to buffer
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

    const qrUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      qr_url: qrUrl,
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

/* =========================================================
   PUT
   Update payment setting
========================================================= */

export async function PUT(request: Request) {
  try {
    const token = getCreatorSession(request);

    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        {
          error: "Creator authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid payment setting ID.",
        },
        { status: 400 }
      );
    }

    const paymentMethod =
      typeof body.payment_method === "string"
        ? body.payment_method.trim()
        : "";

    if (!paymentMethod) {
      return NextResponse.json(
        {
          error: "Payment method is required.",
        },
        { status: 400 }
      );
    }

    const qrUrl =
      typeof body.qr_url === "string" &&
      body.qr_url.trim()
        ? body.qr_url.trim()
        : null;

    const accountName =
      typeof body.account_name === "string" &&
      body.account_name.trim()
        ? body.account_name.trim()
        : null;

    const accountNumber =
      typeof body.account_number === "string" &&
      body.account_number.trim()
        ? body.account_number.trim()
        : null;

    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Server database configuration is missing.",
        },
        { status: 500 }
      );
    }

    const { data: setting, error } =
      await supabaseAdmin
        .from("payment_settings")
        .update({
          payment_method: paymentMethod,
          qr_url: qrUrl,
          account_name: accountName,
          account_number: accountNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
          id,
          payment_method,
          qr_url,
          account_name,
          account_number,
          updated_at
        `)
        .single();

    if (error || !setting) {
      console.error(
        "Could not update payment setting:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not save payment settings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    console.error(
      "Payment settings PUT error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong saving payment settings.",
      },
      { status: 500 }
    );
  }
}