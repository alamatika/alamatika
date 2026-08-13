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

    const signatureHeader =
      request.headers.get("Paymongo-Signature");

    console.log("SIGNATURE HEADER:", signatureHeader);

    const webhookSecret =
      process.env.PAYMONGO_WEBHOOK_SECRET;

    console.log(
      "WEBHOOK SECRET EXISTS:",
      !!webhookSecret
    );

    if (!signatureHeader || !webhookSecret) {
      console.error(
        "Missing PayMongo webhook configuration."
      );

      return NextResponse.json(
        {
          error:
            "Webhook configuration is missing.",
        },
        { status: 400 }
      );
    }

    // Parse PayMongo signature
    const signatureParts =
      signatureHeader.split(",");

    let timestamp = "";
    let testSignature = "";
    let liveSignature = "";

    for (const part of signatureParts) {
      const [key, value] = part.split("=");

      if (key === "t") {
        timestamp = value ?? "";
      }

      if (key === "te") {
        testSignature = value ?? "";
      }

      if (key === "li") {
        liveSignature = value ?? "";
      }
    }

    if (!timestamp) {
      console.error(
        "Missing webhook timestamp."
      );

      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    // Reject very old webhook requests
    const timestampNumber =
      Number(timestamp);

    const currentTimestamp =
      Math.floor(Date.now() / 1000);

    if (
      !Number.isFinite(timestampNumber) ||
      Math.abs(
        currentTimestamp - timestampNumber
      ) > 300
    ) {
      console.error(
        "PayMongo webhook timestamp is too old."
      );

      return NextResponse.json(
        { error: "Expired webhook." },
        { status: 400 }
      );
    }

    // PayMongo signs timestamp + "." + raw body
    const signedPayload =
      `${timestamp}.${rawBody}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(signedPayload)
        .digest("hex");

    let event: {
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

    try {
      event = JSON.parse(rawBody);

      console.log(
        "========== PARSED EVENT =========="
      );

      console.log(
        JSON.stringify(event, null, 2)
      );
    } catch (error) {
      console.error(
        "JSON PARSE ERROR:",
        error
      );

      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    console.log(
  "EVENT TYPE:",
  event?.data?.attributes?.type
);

    console.log(
  "LIVEMODE:",
  event?.data?.attributes?.livemode
);

    const referenceNumber =
      event?.data?.attributes?.data?.attributes
        ?.reference_number;

    
console.log(
  "REFERENCE:",
  event?.data?.attributes?.data?.attributes?.reference_number
);


    const isLiveMode =
      event?.data?.attributes?.livemode === true;

    const receivedSignature =
      isLiveMode
        ? liveSignature
        : testSignature;

    console.log(
      "SIGNATURE MODE:",
      isLiveMode ? "LIVE" : "TEST"
    );

    if (
      !receivedSignature ||
      !safeCompare(
        expectedSignature,
        receivedSignature
      )
    ) {
      console.error(
        "Invalid PayMongo webhook signature."
      );

      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 400 }
      );
    }

    console.log(
      "SIGNATURE VERIFIED!"
    );

    const eventType =
  event?.data?.attributes?.type;

    // Only process successful Checkout payments.
    if (
      eventType !==
      "checkout_session.payment.paid"
    ) {
      console.log(
        "Ignoring event:",
        eventType
      );

      return NextResponse.json({
  received: true,
  diagnostic: true,
  eventType: event?.data?.attributes?.type,
  livemode: event?.data?.attributes?.livemode,
  referenceNumber:
    event?.data?.attributes?.data?.attributes?.reference_number,
});
    }

    if (!referenceNumber) {
      console.error(
        "PayMongo checkout session has no reference number."
      );

      return NextResponse.json(
        {
          error:
            "Missing payment reference.",
        },
        { status: 400 }
      );
    }

    if (
      !referenceNumber.startsWith(
        "ALAMATIKA-"
      )
    ) {
      console.error(
        "Invalid Alamatika payment reference:",
        referenceNumber
      );

      return NextResponse.json(
        {
          error:
            "Invalid payment reference.",
        },
        { status: 400 }
      );
    }

    const purchaseIdText =
      referenceNumber.replace(
        "ALAMATIKA-",
        ""
      );

    const purchaseId =
      Number(purchaseIdText);

    console.log(
      "PURCHASE ID:",
      purchaseId
    );

    if (
      !Number.isSafeInteger(
        purchaseId
      ) ||
      purchaseId <= 0
    ) {
      console.error(
        "Invalid purchase ID:",
        purchaseIdText
      );

      return NextResponse.json(
        {
          error:
            "Invalid purchase ID.",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(
      "SUPABASE URL EXISTS:",
      !!supabaseUrl
    );

    console.log(
      "SUPABASE SERVICE ROLE EXISTS:",
      !!serviceRoleKey
    );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
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

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    console.log(
      "CALLING complete_credit_purchase..."
    );

    const { data, error } =
      await supabaseAdmin.rpc(
        "complete_credit_purchase",
        {
          p_purchase_id:
            purchaseId,
        }
      );

    if (error) {
      console.error(
        "Could not complete credit purchase:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not complete purchase.",
        },
        { status: 500 }
      );
    }

    console.log(
      "RPC RESULT:",
      data
    );

    const result =
      data?.[0];

    console.log(
      "========== PURCHASE COMPLETED =========="
    );

    console.log(
      "PURCHASE ID:",
      result?.purchase_id
    );

    console.log(
      "CREDITS ADDED:",
      result?.credits_added
    );

    console.log(
      "ALREADY PROCESSED:",
      result?.already_processed
    );

    return NextResponse.json({
      received: true,
      purchaseId:
        result?.purchase_id,
      creditsAdded:
        result?.credits_added ?? 0,
      alreadyProcessed:
        result?.already_processed ??
        false,
    });
  } catch (error) {
    console.error(
      "PayMongo webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
export async function GET() {
  console.log("========== WEBHOOK GET TEST ==========");

  return NextResponse.json({
    webhook: "working",
  });
}