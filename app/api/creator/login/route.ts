import { NextResponse } from "next/server";
import crypto from "crypto";

function createSessionToken() {
  const secret = process.env.CREATOR_SESSION_SECRET;

  if (!secret) {
    throw new Error("CREATOR_SESSION_SECRET is not configured.");
  }

  const timestamp = Date.now().toString();

  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  return `${timestamp}.${signature}`;
}

const CREATOR_ACCOUNTS = [
  {
    username: process.env.CREATOR_1_USERNAME,
    password: process.env.CREATOR_1_PASSWORD,
  },
  {
    username: process.env.CREATOR_2_USERNAME,
    password: process.env.CREATOR_2_PASSWORD,
  },
];

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const account = CREATOR_ACCOUNTS.find(
      (creator) =>
        creator.username === username &&
        creator.password === password
    );

    if (!account) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken();

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      "alamatika_creator_session",
      sessionToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 8,
      }
    );

    return response;
  } catch (error) {
    console.error("Creator login error:", error);

    return NextResponse.json(
      { error: "Unable to process login." },
      { status: 500 }
    );
  }
}