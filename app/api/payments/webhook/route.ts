import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    const signatureHeader = request.headers.get("Paymongo-Signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      console.error("Missing PayMongo webhook configuration.");

      return NextResponse.json(
        { error: "Webhook configuration is missing." },
        { status: 400 }
      );
    }

    // Parse PayMongo's signature header.
    const signatureParts = signatureHeader.split(",");

    let timestamp = "";
    let testSignature = "";
    let liveSignature = "";

    for (const part of signatureParts) {
      const [key, value] = part.split("=");

      if (key === "t") timestamp = value ?? "";
      if (key === "te") testSignature = value ?? "";
      if (key === "li") liveSignature = value ?? "";
    }

    if (!timestamp) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    // Reject very old webhook requests.
    const timestampNumber = Number(timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (
      !Number.isFinite(timestampNumber) ||
      Math.abs(currentTimestamp - timestampNumber) > 300
    ) {
      console.error("PayMongo webhook timestamp is too old.");

      return NextResponse.json(
        { error: "Expired webhook." },
        { status: 400 }
      );
    }

    // PayMongo signs: timestamp + "." + raw request body.
    const signedPayload = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    // We need livemode from the event to know whether to use
    // PayMongo's test signature or live signature.
    type PayMongoWebhookEvent = {
  data?: {
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: {
        attributes?: {
          reference_number?: string;
        };
      };
    };
  };
};

let event: PayMongoWebhookEvent;

try {
  event = JSON.parse(rawBody) as PayMongoWebhookEvent;
} catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const isLiveMode = event?.data?.attributes?.livemode === true;

    const receivedSignature = isLiveMode
      ? liveSignature
      : testSignature;

    if (
      !receivedSignature ||
      !safeCompare(expectedSignature, receivedSignature)
    ) {
      console.error("Invalid PayMongo webhook signature.");

      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 400 }
      );
    }

    const eventType = event?.data?.attributes?.type;

    // We only fulfill successful Hosted Checkout payments.
    if (eventType !== "checkout_session.payment.paid") {
      return NextResponse.json({
        received: true,
      });
    }

    const checkoutSession = event?.data?.attributes?.data;

    const referenceNumber =
      checkoutSession?.attributes?.reference_number;

    if (!referenceNumber) {
      console.error("PayMongo checkout session has no reference number.");

      return NextResponse.json(
        { error: "Missing payment reference." },
        { status: 400 }
      );
    }

    if (!referenceNumber.startsWith("ALAMATIKA-")) {
      console.error("Invalid Alamatika payment reference.");

      return NextResponse.json(
        { error: "Invalid payment reference." },
        { status: 400 }
      );
    }

    const purchaseIdText = referenceNumber.replace(
      "ALAMATIKA-",
      ""
    );

    const purchaseId = Number(purchaseIdText);

    if (!Number.isSafeInteger(purchaseId) || purchaseId <= 0) {
      console.error("Invalid purchase ID:", purchaseIdText);

      return NextResponse.json(
        { error: "Invalid purchase ID." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase server configuration is missing.");

      return NextResponse.json(
        { error: "Server database configuration is missing." },
        { status: 500 }
      );
    }

    // This client uses the service-role key so it can call
    // our protected database function.
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

    const { data, error } = await supabaseAdmin.rpc(
      "complete_credit_purchase",
      {
        p_purchase_id: purchaseId,
      }
    );

    if (error) {
      console.error(
        "Could not complete credit purchase:",
        error
      );

      return NextResponse.json(
        { error: "Could not complete purchase." },
        { status: 500 }
      );
    }

    const result = data?.[0];

    return NextResponse.json({
      received: true,
      purchaseId: result?.purchase_id,
      creditsAdded: result?.credits_added ?? 0,
      alreadyProcessed: result?.already_processed ?? false,
    });
  } catch (error) {
    console.error("PayMongo webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}