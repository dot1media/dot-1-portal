import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

// Studio-only: manage a client's account (reset password, change login email).
async function isAdmin() {
  const store = await cookies();
  return !!verifyToken(store.get(ADMIN_COOKIE)?.value);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const b = await request.json().catch(() => ({}));
  const action = String(b.action || "");
  const email = String(b.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "A client email is required." }, { status: 400 });

  const existing = await sql`SELECT id, name, email FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length === 0) return NextResponse.json({ error: "No client account found with that email." }, { status: 404 });

  if (action === "reset-password") {
    const password = String(b.password || "");
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    await sql`UPDATE users SET password_hash = ${hashPassword(password)} WHERE email = ${email}`;
    return NextResponse.json({ ok: true, message: "Password updated." });
  }

  if (action === "change-email") {
    const newEmail = String(b.newEmail || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) return NextResponse.json({ error: "Please enter a valid new email address." }, { status: 400 });
    if (newEmail === email) return NextResponse.json({ error: "That is already this client's email." }, { status: 400 });
    const taken = await sql`SELECT id FROM users WHERE email = ${newEmail} LIMIT 1`;
    if (taken.length > 0) return NextResponse.json({ error: "Another account already uses that email." }, { status: 409 });
    // Move the account and all of the client's bookings together (atomic).
    await sql.transaction([
      sql`UPDATE users SET email = ${newEmail} WHERE email = ${email}`,
      sql`UPDATE portal_sessions SET client_email = ${newEmail} WHERE lower(client_email) = ${email}`,
    ]);
    // Email preferences are optional; move them best-effort without failing the change.
    try { await sql`UPDATE email_prefs SET email = ${newEmail} WHERE lower(email) = ${email}`; } catch (e) {}
    return NextResponse.json({ ok: true, message: "Email updated." });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

