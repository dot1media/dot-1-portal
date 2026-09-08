import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { listPrefix, r2Configured } from "@/lib/r2";
export const runtime = "nodejs";
// Actual bytes in R2, grouped by gallery and by video cut, joined to what the studio recognizes.
export async function GET() {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "R2 not configured." }, { status: 400 });
  const [gal, vid] = await Promise.all([listPrefix("galleries/"), listPrefix("videos/")]);
  const byGallery: Record<string, { bytes: number; objects: number; newest: number }> = {};
  for (const o of gal) { const gid = o.key.split("/")[1]; if (!gid) continue; const g = (byGallery[gid] ||= { bytes: 0, objects: 0, newest: 0 }); g.bytes += o.size; g.objects++; g.newest = Math.max(g.newest, o.modified ? o.modified.getTime() : 0); }
  const byReview: Record<string, { review: number; final: number; newest: number }> = {};
  for (const o of vid) { const rid = o.key.split("/")[1]; if (!rid) continue; const r = (byReview[rid] ||= { review: 0, final: 0, newest: 0 }); if (o.key.endsWith("/review.mp4")) r.review += o.size; else r.final += o.size; r.newest = Math.max(r.newest, o.modified ? o.modified.getTime() : 0); }
  const gids = Object.keys(byGallery), rids = Object.keys(byReview);
  const gRows = gids.length ? (await sql`SELECT g.id, g.title, g.session_id, g.client_email, g.created_at, (SELECT COUNT(*)::int FROM gallery_photos p WHERE p.gallery_id = g.id) AS photos FROM galleries g WHERE g.id = ANY(${gids})`) as any[] : [];
  const rRows = rids.length ? (await sql`SELECT id, title, version, status, session_id, client_email, final_uploaded, created_at FROM video_reviews WHERE id = ANY(${rids})`) as any[] : [];
  const sids = Array.from(new Set([...gRows.map((g) => g.session_id), ...rRows.map((r) => r.session_id)].filter(Boolean)));
  const sRows = sids.length ? (await sql`SELECT id, data FROM portal_sessions WHERE id = ANY(${sids})`) as any[] : [];
  const sName = (id: string) => { const s = sRows.find((x) => x.id === id); const d = s?.data || {}; return s ? [d.clientName, d.type, d.date].filter(Boolean).join(" \u00b7 ") : ""; };
  const galleries = gids.map((id) => { const g = gRows.find((x) => x.id === id); return { id, title: g?.title || "(orphaned gallery)", orphan: !g, session: g ? sName(g.session_id) : "", client: g?.client_email || "", photos: g?.photos || 0, bytes: byGallery[id].bytes, objects: byGallery[id].objects, newest: byGallery[id].newest }; }).sort((a, b) => b.bytes - a.bytes);
  const videos = rids.map((id) => { const r = rRows.find((x) => x.id === id); return { id, title: r ? (r.title || "Cut " + r.version) : "(orphaned video)", orphan: !r, status: r?.status || "", session: r ? sName(r.session_id) : "", client: r?.client_email || "", reviewBytes: byReview[id].review, finalBytes: byReview[id].final, bytes: byReview[id].review + byReview[id].final, newest: byReview[id].newest }; }).sort((a, b) => b.bytes - a.bytes);
  const total = galleries.reduce((a, g) => a + g.bytes, 0) + videos.reduce((a, v) => a + v.bytes, 0);
  return NextResponse.json({ total, galleryBytes: galleries.reduce((a, g) => a + g.bytes, 0), videoBytes: videos.reduce((a, v) => a + v.bytes, 0), galleries, videos, objects: gal.length + vid.length });
}
