import crypto from "crypto";
import { NextResponse } from "next/server";
import { makeToken, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const ADMINS = ["video@dot1.media", "photo@dot1.media"];

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!expected || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "Admin login isn't configured yet. Set ADMIN_PASSWORD and SESSION_SECRET in Vercel." },
      { status: 503 }
    );
  }
  if (!ADMINS.includes(email) || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(ADMIN_COOKIE, makeToken(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

