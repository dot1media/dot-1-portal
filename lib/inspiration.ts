import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { currentClientEmail } from "@/lib/gallery";
export const inspKey = (sid: string, id: string) => `inspiration/${sid}/${id}.jpg`;
export async function ensureInsp() { await sql`CREATE TABLE IF NOT EXISTS inspiration (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, client_email TEXT, note TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now())`; }
export async function canSee(sessionId: string) {
  if (await hasStudio()) return true;
  const em = await currentClientEmail(); if (!em) return false;
  const r = ((await sql`SELECT client_email FROM portal_sessions WHERE id = ${sessionId} LIMIT 1`) as any[])[0];
  return !!r && String(r.client_email || "").toLowerCase() === em;
}
