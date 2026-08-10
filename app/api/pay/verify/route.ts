import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

function squareBase() {
  return (process.env.SQUARE_ENV || "").trim() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

export async function GET(request: Request) {
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  const { searchParams } = new URL(request.url);
  const sid = String(searchParams.get("sid") || "");
  const isBalance = String(searchParams.get("kind") || "") === "balance";
  if (!sid) return NextResponse.json({ error: "Missing sid." }, { status: 400 });

  const rows = await sql`SELECT data FROM portal_sessions WHERE id = ${sid} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ paid: false });
  const data = (rows[0] as any).data || {};
  const already = isBalance ? data.balanceStatus === "paid" : data.paymentStatus === "paid";
  if (already) return NextResponse.json({ paid: true });

  const orderId = isBalance ? data.balanceOrderId : data.squareOrderId;
  if (!token || !orderId) return NextResponse.json({ paid: false });

  const res = await fetch(squareBase() + "/v2/orders/" + orderId, {
    headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" },
  });
  const od = await res.json().catch(() => ({}));
  const order = od.order || {};
  const paid = order.state === "COMPLETED" ||
    (Array.isArray(order.tenders) && order.tenders.length > 0) ||
    (order.net_amount_due_money && Number(order.net_amount_due_money.amount) === 0 && order.total_money && Number(order.total_money.amount) > 0);
  if (paid) {
    const merged = isBalance
      ? { ...data, balanceStatus: "paid", payAmount: Number(data.total) || data.payAmount }
      : { ...data, paymentStatus: "paid" };
    await sql`UPDATE portal_sessions SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE id = ${sid}`;
  }
  return NextResponse.json({ paid });
}

