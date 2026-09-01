import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";

let ensured = false;
export async function ensureGallerySchema() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS galleries (id TEXT PRIMARY KEY, session_id TEXT, client_email TEXT, title TEXT, included INT, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`ALTER TABLE galleries ADD COLUMN IF NOT EXISTS included INT`;
  await sql`ALTER TABLE galleries ADD COLUMN IF NOT EXISTS release JSONB`;
  await sql`CREATE TABLE IF NOT EXISTS gallery_photos (id TEXT PRIMARY KEY, gallery_id TEXT NOT NULL, filename TEXT, favorite BOOLEAN DEFAULT false, sort INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS gallery_photos_gid ON gallery_photos (gallery_id)`;
  ensured = true;
}
export const keyThumb = (gid: string, pid: string) => `galleries/${gid}/${pid}/thumb.jpg`;
export const keyProof = (gid: string, pid: string) => `galleries/${gid}/${pid}/proof.jpg`;
export const keyFull  = (gid: string, pid: string) => `galleries/${gid}/${pid}/full.jpg`;
export function newId(prefix = "") { return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

export async function currentClientEmail(): Promise<string> {
  try { const store = await cookies(); const c = verifyClientToken(store.get(CLIENT_COOKIE)?.value); return c ? String((c as any).email || "").toLowerCase() : ""; }
  catch { return ""; }
}
// Row for a photo joined to its gallery's owner email, for access checks.
export async function photoWithOwner(photoId: string): Promise<any | null> {
  const rows = (await sql`SELECT p.id, p.gallery_id, p.filename, p.favorite, g.client_email FROM gallery_photos p JOIN galleries g ON g.id = p.gallery_id WHERE p.id = ${photoId} LIMIT 1`) as any[];
  return rows[0] || null;
}
