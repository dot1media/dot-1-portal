import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureGallerySchema, keyProof, keyThumb } from "@/lib/gallery";
import { presignGet } from "@/lib/r2";
export const runtime = "nodejs";
// Public, token-gated, view-only: a client's favorited photos as proofs. No full-res, no download.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });
  await ensureGallerySchema();
  try { await sql`CREATE TABLE IF NOT EXISTS gallery_shares (token TEXT PRIMARY KEY, gallery_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`; } catch {}
  const sh = ((await sql`SELECT gallery_id FROM gallery_shares WHERE token = ${token} LIMIT 1`) as any[])[0];
  if (!sh) return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
  const g = ((await sql`SELECT id, title FROM galleries WHERE id = ${sh.gallery_id} LIMIT 1`) as any[])[0];
  if (!g) return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  const photos = (await sql`SELECT id FROM gallery_photos WHERE gallery_id = ${g.id} AND favorite = true ORDER BY sort ASC, created_at ASC`) as any[];
  const out = await Promise.all(photos.map(async (p) => ({ id: p.id, thumb: await presignGet(keyThumb(g.id, p.id), 3600), proof: await presignGet(keyProof(g.id, p.id), 3600) })));
  return NextResponse.json({ title: g.title || "Shared favorites", photos: out });
}
