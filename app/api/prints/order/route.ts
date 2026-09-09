import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import { currentClientEmail } from "@/lib/gallery";
import { products, ensurePrints } from "@/lib/prints";
import { sendEmail } from "@/lib/email";
import { sendPush } from "@/lib/push";
export const runtime = "nodejs";
const squareBase = () => (process.env.SQUARE_ENV === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com");
// Client places a print order: validated against the catalog, priced server-side, paid as a charge on the session
// through the same Square payment-link + webhook + verify path every other charge uses.
export async function POST(req: Request) {
  const em = await currentClientEmail();
  if (!em) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const sid = String(b.sessionId || ""), gid = String(b.galleryId || "");
  const s = ((await sql`SELECT id, data FROM portal_sessions WHERE id = ${sid} LIMIT 1`) as any[])[0];
  if (!s || String(s.data?.clientEmail || "").toLowerCase() !== em) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensurePrints();
  const cat = await products(true); const byId: Record<string, any> = {}; for (const p of cat) byId[p.id] = p;
  const photoIds = new Set(((await sql`SELECT id FROM gallery_photos WHERE gallery_id = ${gid}`) as any[]).map((p) => p.id));
  const items: { photoId: string; productId: string; name: string; qty: number; unitCents: number }[] = [];
  for (const it of (Array.isArray(b.items) ? b.items : [])) { const p = byId[String(it.productId)]; const qty = Math.max(1, Math.min(50, parseInt(String(it.qty), 10) || 1)); if (!p || !photoIds.has(String(it.photoId))) continue; items.push({ photoId: String(it.photoId), productId: p.id, name: p.name, qty, unitCents: Number(p.price_cents) || 0 }); }
  if (!items.length) return NextResponse.json({ error: "Nothing valid in the cart." }, { status: 400 });
  const total = items.reduce((a, it) => a + it.qty * it.unitCents, 0);
  const ship = { name: String(b.shipping?.name || "").slice(0, 120), address: String(b.shipping?.address || "").slice(0, 400) };
  if (!ship.name || !ship.address) return NextResponse.json({ error: "Add a name and shipping address." }, { status: 400 });
  const token = process.env.SQUARE_ACCESS_TOKEN, locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) return NextResponse.json({ error: "Payments are not configured yet. We'll invoice you for these prints." }, { status: 400 });
  const data = s.data || {};
  const chargeId = "chg_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const orderId = "po_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const label = ("Prints: " + items.map((it) => it.qty + "× " + it.name).join(", ")).slice(0, 80);
  const payload: any = { idempotency_key: crypto.randomUUID(), quick_pay: { name: label.slice(0, 60), price_money: { amount: total, currency: "USD" }, location_id: locationId }, checkout_options: { redirect_url: "https://portal.dot1.media/?paid=" + sid + "&kind=charge&charge=" + chargeId }, payment_note: "Print order " + orderId + " for booking " + sid, pre_populated_data: { buyer_email: em } };
  let sq: any = {}; let res: Response;
  try { res = await fetch(squareBase() + "/v2/online-checkout/payment-links", { method: "POST", headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(payload) }); sq = await res.json().catch(() => ({})); }
  catch (e: any) { return NextResponse.json({ error: "Could not reach Square." }, { status: 502 }); }
  if (!res.ok || !sq.payment_link?.url) return NextResponse.json({ error: "Square could not create the checkout." }, { status: 502 });
  const charge = { id: chargeId, label, amountCents: total, status: "pending", kind: "prints", orderId, squareOrderId: sq.payment_link.order_id || "", squareLink: sq.payment_link.url, createdAt: new Date().toISOString() };
  await sql`UPDATE portal_sessions SET data = ${JSON.stringify({ ...data, charges: [...(Array.isArray(data.charges) ? data.charges : []), charge] })}::jsonb, updated_at = now() WHERE id = ${sid}`;
  await sql`INSERT INTO print_orders (id, session_id, gallery_id, client_email, charge_id, items, total_cents, shipping) VALUES (${orderId}, ${sid}, ${gid || null}, ${em}, ${chargeId}, ${JSON.stringify(items)}::jsonb, ${total}, ${JSON.stringify(ship)}::jsonb)`;
  try { await sendPush("Print order", (data.clientName || em) + " \u00b7 $" + (total / 100).toFixed(2) + " \u00b7 " + items.reduce((a, it) => a + it.qty, 0) + " prints", "/"); } catch {}
  try { await sendEmail({ to: data.notifyEmail || "contact@dot1.media", subject: "Print order from " + (data.clientName || em), html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d"><p><b>${data.clientName || em}</b> ordered prints ($${(total / 100).toFixed(2)}), pending payment:</p><ul>${items.map((it) => `<li>${it.qty}× ${it.name}</li>`).join("")}</ul><p>Ship to: ${ship.name}<br/>${ship.address.replace(/\n/g, "<br/>")}</p></div>` }); } catch {}
  return NextResponse.json({ ok: true, orderId, chargeId, url: sq.payment_link.url, total: total / 100 });
}
