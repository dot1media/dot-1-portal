import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyResetToken, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const token = String(b.token || "");
  const password = String(b.password || "");
  const v = verifyResetToken(token);
  if (!v || !v.email) return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  await sql`UPDATE users SET password_hash = ${hashPassword(password)} WHERE email = ${v.email.toLowerCase()}`;
  return NextResponse.json({ ok: true });
}

