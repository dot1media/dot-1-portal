import { sql } from "@/lib/db";

// Admin identity for the whole Dot One suite. Accounts live here (in the portal DB); other
// apps trust the signed cookie, they don't read this table. Restricted to @dot1.media.

export function isDot1Email(email: string): boolean {
  return /^[^@\s]+@dot1\.media$/i.test(String(email || "").trim());
}

// The admin cookie is set on the parent domain so every *.dot1.media app can see it. On any other
// host (vercel.app previews, localhost) the domain is omitted so the cookie still works there.
export function adminCookieOpts(host: string | null | undefined) {
  const h = String(host || "").toLowerCase().split(":")[0];
  const shared = h === "dot1.media" || h.endsWith(".dot1.media");
  const base = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };
  return shared ? { ...base, domain: ".dot1.media" } : base;
}
export const ADMIN_COOKIE_CLEAR = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", domain: ".dot1.media", maxAge: 0 };

let ensured = false;
export async function ensureAdminTable(): Promise<void> {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS admin_accounts (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  ensured = true;
}

export async function adminCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS n FROM admin_accounts`;
  return rows[0]?.n || 0;
}
export async function listAdmins() {
  return await sql`SELECT id, email, name, created_at FROM admin_accounts ORDER BY email`;
}
export async function getAdminHash(email: string): Promise<string | null> {
  const rows = await sql`SELECT password_hash FROM admin_accounts WHERE email = ${email.toLowerCase()} LIMIT 1`;
  return rows.length ? rows[0].password_hash : null;
}
