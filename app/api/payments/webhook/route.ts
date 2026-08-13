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

    console.log("========== PAYMONGO WEBHOOK RECEIVED ==========");
    console.log("RAW BODY:", rawBody);

    const signatureHeader = request.headers.get("Paymongo-Signature");

    console.log("SIGNATURE HEADER:", signatureHeader);

    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    console.log(
      "WEBHOOK SECRET EXISTS:",
      !!webhookSecret
    );

    if (!signatureHeader || !webhookSecret) {
      console.error("Missing PayMongo webhook configuration.");

      return NextResponse.json(
        { error: "Webhook configuration is missing." },
        { status: 400 }
      );
    }

    let event: {
  data?: {
    type?: string;
    attributes?: {
      livemode?: boolean;
      data?: {
        attributes?: {
          reference_number?: string;
        };
      };
    };
  };
};

    try {
      event = JSON.parse(rawBody);

      console.log("========== PARSED EVENT ==========");
      console.log(JSON.stringify(event, null, 2));
    } catch (error) {
      console.error("JSON PARSE ERROR:", error);

      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    console.log("EVENT TYPE:", event?.data?.type);
    console.log(
      "LIVEMODE:",
      event?.data?.attributes?.livemode
    );

    console.log(
      "REFERENCE:",
      event?.data?.attributes?.data?.attributes?.reference_number
    );

    return NextResponse.json({
      received: true,
      diagnostic: true,
    });

  } catch (error) {
    console.error("WEBHOOK CRASH:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}