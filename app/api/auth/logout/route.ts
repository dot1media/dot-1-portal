import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";
import { ADMIN_COOKIE_CLEAR } from "@/lib/admins";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Clear the shared cookie (must match the domain it was set with) and any old host-only one.
  res.cookies.set(ADMIN_COOKIE, "", ADMIN_COOKIE_CLEAR);
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
