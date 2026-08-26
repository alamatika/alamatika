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

    const chapterId = String(
      body.chapterId ?? ""
    );

    if (!chapterId) {
      return NextResponse.json(
        {
          error:
            "Missing chapterId.",
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

    const {
      data: chapter,
      error: chapterError,
    } = await supabase
      .from("chapters")
      .select(
        "id, cover_image, page_images"
      )
      .eq("id", chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        {
          error:
            "Chapter not found.",
        },
        { status: 404 }
      );
    }

    // Delete chapter cover.
    if (
      chapter.cover_image &&
      typeof chapter.cover_image ===
        "string"
    ) {
      const marker =
        "/storage/v1/object/public/covers/";

      try {
        const url = new URL(
          chapter.cover_image
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
            const { error } =
              await supabase.storage
                .from("covers")
                .remove([path]);

            if (error) {
              console.error(
                "Chapter cover delete error:",
                error
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Chapter cover path error:",
          error
        );
      }
    }

    // Delete chapter pages.
    const pages =
      Array.isArray(chapter.page_images)
        ? chapter.page_images
        : [];

    for (const page of pages) {
      if (
        typeof page !== "string" ||
        !page
      ) {
        continue;
      }

      // Private premium page.
      if (
        !page.startsWith("http")
      ) {
        const { error } =
          await supabase.storage
            .from("premium-pages")
            .remove([page]);

        if (error) {
          throw new Error(
            `Failed to delete premium page: ${page}`
          );
        }

        continue;
      }

      // Public/free page.
      const marker =
        "/storage/v1/object/public/pages/";

      try {
        const url = new URL(page);

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
            const { error } =
              await supabase.storage
                .from("pages")
                .remove([path]);

            if (error) {
              throw new Error(
                `Failed to delete public page: ${path}`
              );
            }
          }
        }
      } catch (error) {
        if (
          error instanceof Error
        ) {
          throw error;
        }

        throw new Error(
          "Invalid public page URL."
        );
      }
    }

    // Delete chapter record last.
    const {
      error: deleteError,
    } = await supabase
      .from("chapters")
      .delete()
      .eq("id", chapter.id);

    if (deleteError) {
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
      "Chapter delete error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete chapter.",
      },
      { status: 500 }
    );
  }
}