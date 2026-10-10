import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";

export const runtime = "nodejs";

// Studio-only: manage a client's account (reset password, change login email).
async function isAdmin() {
  const store = await cookies();
  return await hasStudio();
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const b = await request.json().catch(() => ({}));
  const action = String(b.action || "");
  const email = String(b.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "A client email is required." }, { status: 400 });

  // Create a client account on the client's behalf (e.g. when an invoice was paid by someone else and
  // the real client never onboarded). Does NOT sign the admin in as the client (no client cookie set).
  if (action === "create") {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    const name = String(b.name || "").trim();
    if (!name) return NextResponse.json({ error: "A name is required." }, { status: 400 });
    const phone = String(b.phone || "").trim() || null;
    const password = String(b.password || "");
    if (password && password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    const dupe = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (dupe.length > 0) return NextResponse.json({ error: "An account already uses that email." }, { status: 409 });
    const rows = await sql`
      INSERT INTO users (name, email, phone, role, password_hash)
      VALUES (${name}, ${email}, ${phone}, 'client', ${password ? hashPassword(password) : null})
      RETURNING id, name, email, phone, role, avatar_url, (password_hash IS NOT NULL) AS has_password
    `;
    return NextResponse.json({ ok: true, user: rows[0], message: "Account created." });
  }

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

