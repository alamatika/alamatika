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

  try {
    const url = new URL(request.url);

    const conversationId = Number(
      url.searchParams.get(
        "conversationId"
      )
    );

    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid conversation ID.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getAdminSupabase();

    const { data, error } =
      await supabase
        .from("creator_messages")
        .select("*")
        .eq(
          "conversation_id",
          conversationId
        )
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Creator chat messages error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not load conversation.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: data ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Could not load conversation.",
      },
      { status: 500 }
    );
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

    const conversationId = Number(
      body.conversationId
    );

    const message = String(
      body.message || ""
    ).trim();

    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid conversation ID.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Message cannot be empty.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getAdminSupabase();

    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("creator_conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .single();

    if (
      conversationError ||
      !conversation
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation not found.",
        },
        { status: 404 }
      );
    }

    const {
      data: insertedMessage,
      error: messageError,
    } = await supabase
      .from("creator_messages")
      .insert({
        conversation_id:
          conversationId,
        user_id:
          conversation.user_id,
        sender: "creator",
        subject: "Conversation",
        message,
        status: "answered",
        is_read: false,
      })
      .select("*")
      .single();

    if (
      messageError ||
      !insertedMessage
    ) {
      console.error(
        "Creator reply error:",
        messageError
      );

      return NextResponse.json(
        {
          error:
            "Could not send reply.",
        },
        { status: 500 }
      );
    }

    const { error: updateError } =
      await supabase
        .from("creator_conversations")
        .update({
          status: "answered",
        })
        .eq("id", conversationId);

    if (updateError) {
      console.error(
        "Conversation status update error:",
        updateError
      );
    }

    return NextResponse.json({
      success: true,
      message: insertedMessage,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Invalid request.",
      },
      { status: 400 }
    );
  }
}