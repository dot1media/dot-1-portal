import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";

let ensured = false;
export async function ensureVideoSchema() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS video_reviews (id TEXT PRIMARY KEY, session_id TEXT, client_email TEXT, version INT, title TEXT, uploaded BOOLEAN DEFAULT false, status TEXT DEFAULT 'open', approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS video_comments (id TEXT PRIMARY KEY, review_id TEXT NOT NULL, t REAL DEFAULT 0, body TEXT, author TEXT, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS video_comments_rid ON video_comments (review_id)`;
  await sql`ALTER TABLE video_reviews ADD COLUMN IF NOT EXISTS final_uploaded BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE video_reviews ADD COLUMN IF NOT EXISTS final_filename TEXT`;
  ensured = true;
}
export const videoKey = (reviewId: string) => `videos/${reviewId}/review.mp4`;
export const finalKey = (reviewId: string) => `videos/${reviewId}/final`;
export function newId(prefix = "") { return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
export async function currentClientEmail(): Promise<string> {
  try { const store = await cookies(); const c = verifyClientToken(store.get(CLIENT_COOKIE)?.value); return c ? String((c as any).email || "").toLowerCase() : ""; } catch { return ""; }
}
export async function reviewWithOwner(reviewId: string): Promise<any | null> {
  const rows = (await sql`SELECT * FROM video_reviews WHERE id = ${reviewId} LIMIT 1`) as any[];
  return rows[0] || null;
}
