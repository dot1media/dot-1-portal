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

// A client may access a review if their email matches the session's CURRENT client email or the
// email snapshot stored on the review. Keying only off the snapshot broke access whenever the studio
// changed the session's email after the cut was uploaded.
export async function clientMayAccessReview(rv: any, email: string): Promise<boolean> {
  const em = String(email || "").toLowerCase();
  if (!em || !rv) return false;
  if (em === String(rv.client_email || "").toLowerCase()) return true;
  if (rv.session_id) {
    const s = (await sql`SELECT client_email FROM portal_sessions WHERE id = ${rv.session_id} LIMIT 1`) as any[];
    if (em === String(s[0]?.client_email || "").toLowerCase()) return true;
  }
  return false;
}
