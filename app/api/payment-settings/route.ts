import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
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

    const { data, error } =
      await supabaseAdmin
        .from("payment_settings")
        .select(`
          id,
          payment_method,
          qr_url,
          account_name,
          account_number
        `)
        .order("id", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Could not load public payment settings:",
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
      settings: data ?? [],
    });
  } catch (error) {
    console.error(
      "Public payment settings error:",
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