import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensurePrints } from "@/lib/prints";
import { keyThumb } from "@/lib/gallery";
import { presignGet } from "@/lib/r2";
import { sendToClient } from "@/lib/email";
export const runtime = "nodejs";
export async function GET(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensurePrints();
  const sid = new URL(req.url).searchParams.get("sessionId") || "";
  const rows = (sid ? await sql`SELECT * FROM print_orders WHERE session_id = ${sid} ORDER BY created_at DESC` : await sql`SELECT * FROM print_orders ORDER BY created_at DESC LIMIT 200`) as any[];
  const out = [];
  for (const o of rows) {
    const s = ((await sql`SELECT data FROM portal_sessions WHERE id = ${o.session_id} LIMIT 1`) as any[])[0];
    const ch = (s?.data?.charges || []).find((c: any) => c.id === o.charge_id);
    const items = await Promise.all((o.items || []).map(async (it: any) => ({ ...it, thumb: o.gallery_id ? await presignGet(keyThumb(o.gallery_id, it.photoId), 3600).catch(() => "") : "" })));
    out.push({ id: o.id, sessionId: o.session_id, client: s?.data?.clientName || o.client_email, email: o.client_email, items, total: (Number(o.total_cents) || 0) / 100, shipping: o.shipping || {}, paid: ch ? ch.status === "paid" : false, fulfilledAt: o.fulfilled_at, createdAt: o.created_at });
  }
  return NextResponse.json({ orders: out });
}
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensurePrints();
  const b: any = await req.json().catch(() => ({}));
  const id = String(b.orderId || ""); if (!id) return NextResponse.json({ error: "Missing order." }, { status: 400 });
  const o = ((await sql`SELECT * FROM print_orders WHERE id = ${id} LIMIT 1`) as any[])[0]; if (!o) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await sql`UPDATE print_orders SET fulfilled_at = ${b.fulfilled === false ? null : new Date().toISOString()} WHERE id = ${id}`;
  if (b.fulfilled !== false && o.client_email) { try { await sendToClient(o.client_email, "updates", { subject: "Your prints are on the way", html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d;line-height:1.6"><p>Good news: your print order has been sent to ${(o.shipping || {}).name || "you"}.</p><ul>${(o.items || []).map((it: any) => `<li>${it.qty}× ${it.name}</li>`).join("")}</ul><p>Thank you for choosing Dot One Media.</p></div>` }); } catch {} }
  return NextResponse.json({ ok: true });
}
