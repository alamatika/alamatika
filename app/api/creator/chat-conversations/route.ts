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

export async function GET(request: Request) {
  if (!verifyCreatorSession(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
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
      data: conversations,
      error: conversationError,
    } = await supabase
      .from("creator_conversations")
      .select(
        "id, user_id, status, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (conversationError) {
      console.error(
        "Creator conversations error:",
        conversationError
      );

      return NextResponse.json(
        {
          error:
            "Could not load conversations.",
        },
        { status: 500 }
      );
    }

    const conversationIds =
  (conversations ?? []).map(
    (conversation) => conversation.id
  );

let messages: {
  id: number;
  conversation_id: number;
  message: string;
  sender: string;
  created_at: string;
}[] = [];

if (conversationIds.length > 0) {
  const { data: messageData, error } =
    await supabase
      .from("creator_messages")
      .select(
        "id, conversation_id, message, sender, created_at"
      )
      .in(
        "conversation_id",
        conversationIds
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "Creator conversation messages error:",
      error
    );
  }

  messages = messageData ?? [];
}

    const userIds = [
      ...new Set(
        (conversations ?? []).map(
          (conversation) =>
            conversation.user_id
        )
      ),
    ];

    let profiles: {
      id: string;
      username: string | null;
      avatar: string | null;
    }[] = [];

    if (userIds.length > 0) {
      const { data: profileData, error } =
        await supabase
          .from("profiles")
          .select(
            "id, username, avatar"
          )
          .in("id", userIds);

      if (error) {
        console.error(
          "Creator conversation profiles error:",
          error
        );
      }

      profiles = profileData ?? [];
    }

    const merged =
  (conversations ?? []).map(
    (conversation) => {

      const latestMessage =
        messages.find(
          (message) =>
            message.conversation_id ===
            conversation.id
        ) ?? null;

      return {
        ...conversation,

        profiles:
          profiles.find(
            (profile) =>
              profile.id ===
              conversation.user_id
          ) ?? null,

        latest_message:
          latestMessage,
      };
    }
  );

    return NextResponse.json({
      conversations: merged,
    });
  } catch (error) {
    console.error(
      "Creator conversations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not load conversations.",
      },
      { status: 500 }
    );
  }
}