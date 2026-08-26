import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { SHOP_CATALOG, ensureShopSchema, isOrderPaid } from "@/lib/shop";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const t = String(new URL(req.url).searchParams.get("t") || "");
  if (!t) return NextResponse.json({ paid: false });
  await ensureShopSchema();
  const rows = (await sql`SELECT product, square_order_id, status FROM shop_orders WHERE token = ${t} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ paid: false });
  const row = rows[0];
  const item = SHOP_CATALOG[row.product];
  let paid = row.status === "paid";
  if (!paid) { paid = await isOrderPaid(row.square_order_id); if (paid) await sql`UPDATE shop_orders SET status = 'paid' WHERE token = ${t}`; }
  if (!paid) return NextResponse.json({ paid: false });
  const download = item && item.digital ? `/api/shop/download?t=${encodeURIComponent(t)}` : null;
  return NextResponse.json({ paid: true, download, digital: !!(item && item.digital) });
}
