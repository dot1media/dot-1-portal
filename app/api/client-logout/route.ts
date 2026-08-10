import { NextResponse } from "next/server";
import { CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CLIENT_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

