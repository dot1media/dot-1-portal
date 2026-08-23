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

import { normalizeGrants, fullGrants, type Grants, type Tier, type SuiteAccount } from "@/lib/suite";

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
  // Suite access columns, added idempotently so existing installs upgrade in place.
  await sql`ALTER TABLE admin_accounts ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'user'`;
  await sql`ALTER TABLE admin_accounts ADD COLUMN IF NOT EXISTS grants JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE admin_accounts ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT false`;

  // One-time safe migration: every account that predates the tier system was a full suite admin,
  // so promote any still-default rows to owner with full access. This guarantees no lockout on
  // upgrade. New accounts are created explicitly with their intended tier, so this only ever
  // touches the legacy rows once (the marker column flips them off afterward).
  await sql`ALTER TABLE admin_accounts ADD COLUMN IF NOT EXISTS tier_migrated BOOLEAN NOT NULL DEFAULT false`;
  const legacy = await sql`SELECT id FROM admin_accounts WHERE tier_migrated = false`;
  if (legacy.length) {
    const full = JSON.stringify(fullGrants());
    await sql`UPDATE admin_accounts SET tier = 'owner', grants = ${full}::jsonb, tier_migrated = true WHERE tier_migrated = false`;
  }
  ensured = true;
}

export async function adminCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS n FROM admin_accounts`;
  return rows[0]?.n || 0;
}
export async function ownerCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS n FROM admin_accounts WHERE tier = 'owner' AND disabled = false`;
  return rows[0]?.n || 0;
}
export async function listAdmins() {
  return await sql`SELECT id, email, name, tier, grants, disabled, created_at FROM admin_accounts ORDER BY tier, email`;
}
export async function getAdminHash(email: string): Promise<string | null> {
  const rows = await sql`SELECT password_hash FROM admin_accounts WHERE email = ${email.toLowerCase()} AND disabled = false LIMIT 1`;
  return rows.length ? rows[0].password_hash : null;
}

// The full suite identity for an account, used by login (to bake the cookie) and /api/suite/me.
export async function getSuiteAccount(email: string): Promise<SuiteAccount | null> {
  const rows = await sql`SELECT email, name, tier, grants, disabled FROM admin_accounts WHERE email = ${email.toLowerCase()} LIMIT 1`;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    email: r.email,
    name: r.name || "",
    tier: (r.tier || "user") as Tier,
    grants: normalizeGrants(r.grants),
    disabled: !!r.disabled,
  };
}

export async function getAccountById(id: number): Promise<any | null> {
  const rows = await sql`SELECT id, email, name, tier, grants, disabled FROM admin_accounts WHERE id = ${id} LIMIT 1`;
  return rows.length ? rows[0] : null;
}

export async function updateAccountAccess(id: number, tier: Tier, grants: Grants, disabled: boolean): Promise<void> {
  await sql`UPDATE admin_accounts SET tier = ${tier}, grants = ${JSON.stringify(grants)}::jsonb, disabled = ${disabled} WHERE id = ${id}`;
}
