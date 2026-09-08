import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentClientEmail } from "@/lib/gallery";
export const runtime = "nodejs";
// Everything a client can download or open, across all of their sessions.
export async function GET() {
  const em = await currentClientEmail();
  if (!em) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const sessions = (await sql`SELECT id, date, data FROM portal_sessions WHERE lower(client_email) = ${em} AND status IS DISTINCT FROM 'cancelled' ORDER BY date DESC NULLS LAST`) as any[];
  const ids = sessions.map((s) => s.id);
  let finals: any[] = [], galleries: any[] = [];
  if (ids.length) {
    try { finals = (await sql`SELECT id, session_id, title, final_filename FROM video_reviews WHERE session_id = ANY(${ids}) AND final_uploaded = true ORDER BY version DESC`) as any[]; } catch {}
    try { galleries = (await sql`SELECT g.id, g.session_id, g.title, (SELECT COUNT(*)::int FROM gallery_photos p WHERE p.gallery_id = g.id) AS n FROM galleries g WHERE g.session_id = ANY(${ids})`) as any[]; } catch {}
  }
  const out: any[] = [];
  for (const s of sessions) {
    const d = s.data || {}; const base = { sessionId: s.id, session: (d.type || "Session") + (d.date ? " \u00b7 " + d.date : ""), date: d.date || null };
    for (const f of finals.filter((x) => x.session_id === s.id)) out.push({ ...base, kind: "final", label: "Final video" + (f.title ? " \u00b7 " + f.title : ""), note: f.final_filename || "High-quality download", href: "/api/video/final?reviewId=" + f.id, direct: true });
    for (const g of galleries.filter((x) => x.session_id === s.id)) if (Number(g.n) > 0) out.push({ ...base, kind: "gallery", label: g.title || "Photo gallery", note: g.n + " photo" + (Number(g.n) === 1 ? "" : "s") + " \u00b7 select & download in your gallery", open: true });
    if (d.deliveryVideo) out.push({ ...base, kind: "link", label: "Final Film", note: "External link", href: d.deliveryVideo });
    if (d.deliveryPhoto) out.push({ ...base, kind: "link", label: "Full Gallery", note: "External link", href: d.deliveryPhoto });
    if (d.deliveryMusic) out.push({ ...base, kind: "link", label: "Audio", note: "External link", href: d.deliveryMusic });
    if (d.deliveryGov) out.push({ ...base, kind: "link", label: "Deliverables", note: "External link", href: d.deliveryGov });
    for (const x of (Array.isArray(d.deliverables) ? d.deliverables : [])) if (x && x.url) out.push({ ...base, kind: "link", label: x.label || "Deliverable", note: x.note || "External link", href: x.url });
  }
  return NextResponse.json({ items: out, sessions: sessions.length });
}
