import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { makeResetToken } from "@/lib/auth";
import { sendEmail, resetEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  if (email) {
    const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (users.length > 0) {
      const link = "https://portal.dot1.media/?reset=" + encodeURIComponent(makeResetToken(email));
      await sendEmail({ to: email, subject: "Reset your Dot One Media password", html: resetEmail(link), replyTo: "contact@dot1.media" });
    }
  }
  // Always return ok so we never reveal whether an email is registered.
  return NextResponse.json({ ok: true });
}

