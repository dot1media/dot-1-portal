import { sql } from "@/lib/db";

// Global client-email switch, stored in the DB so the studio can flip it from the admin portal
// (no Vercel env var needed). Default is OFF: until the Acuity → portal cutover, no session email
// reaches a client. Studio-facing notifications are never gated by this.

let cache: { at: number; val: boolean } | null = null;
const TTL = 10000; // short, so a toggle takes effect within ~10s across serverless instances

export async function ensureFlagsSchema(): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS portal_flags (
    key TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`;
}

export async function clientEmailsEnabled(): Promise<boolean> {
  if (cache && Date.now() - cache.at < TTL) return cache.val;
  let val = false;
  try {
    await ensureFlagsSchema();
    const r = (await sql`SELECT enabled FROM portal_flags WHERE key = 'client_emails' LIMIT 1`) as any[];
    val = r.length ? !!r[0].enabled : false;
  } catch {
    val = false; // fail safe: suppressed if we can't read the flag
  }
  cache = { at: Date.now(), val };
  return val;
}

export async function setClientEmailsEnabled(on: boolean): Promise<void> {
  await ensureFlagsSchema();
  await sql`INSERT INTO portal_flags (key, enabled, updated_at) VALUES ('client_emails', ${!!on}, now())
    ON CONFLICT (key) DO UPDATE SET enabled = ${!!on}, updated_at = now()`;
  cache = { at: Date.now(), val: !!on };
}
