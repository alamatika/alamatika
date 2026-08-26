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

    const storyId = String(
      body.storyId ?? ""
    );

    const seasonId = String(
      body.seasonId ?? ""
    );

    if (!storyId || !seasonId) {
      return NextResponse.json(
        {
          error:
            "Missing storyId or seasonId.",
        },
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

    // Make sure the season exists and belongs
    // to the requested story.
    const {
      data: season,
      error: seasonError,
    } = await supabase
      .from("seasons")
      .select(
        "id, story_id, cover_image"
      )
      .eq("id", seasonId)
      .eq("story_id", storyId)
      .single();

    if (seasonError || !season) {
      return NextResponse.json(
        {
          error:
            "Season not found.",
        },
        { status: 404 }
      );
    }

    // Never delete a season that still contains chapters.
    const {
      data: chapters,
      error: chaptersError,
    } = await supabase
      .from("chapters")
      .select("id")
      .eq("season_id", season.id)
      .limit(1);

    if (chaptersError) {
      console.error(
        "Season chapter check error:",
        chaptersError
      );

      return NextResponse.json(
        {
          error:
            "Could not check season chapters.",
        },
        { status: 500 }
      );
    }

    if (
      chapters &&
      chapters.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "This season still contains chapters. Delete or move them first.",
        },
        { status: 409 }
      );
    }

    // Remove the season cover.
    if (season.cover_image) {
      const marker =
        "/storage/v1/object/public/covers/";

      try {
        const url = new URL(
          season.cover_image
        );

        const index =
          url.pathname.indexOf(marker);

        if (index !== -1) {
          const path =
            decodeURIComponent(
              url.pathname.substring(
                index + marker.length
              )
            );

          if (path) {
            const { error: coverError } =
              await supabase.storage
                .from("covers")
                .remove([path]);

            if (coverError) {
              console.error(
                "Season cover delete error:",
                coverError
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Season cover path error:",
          error
        );
      }
    }

    const {
      error: deleteError,
    } = await supabase
      .from("seasons")
      .delete()
      .eq("id", season.id)
      .eq("story_id", storyId);

    if (deleteError) {
      console.error(
        "Season delete error:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Season delete request error:",
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