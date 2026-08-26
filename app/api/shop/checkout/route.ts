import { NextResponse } from "next/server";
import { createRetainerLink } from "@/lib/square-link";
import { SHOP_CATALOG, ensureShopSchema, newToken } from "@/lib/shop";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = String(url.searchParams.get("product") || "");
  const item = SHOP_CATALOG[id];
  if (!item) return NextResponse.redirect(new URL("/shop.html?error=unknown", url.origin), 303);
  await ensureShopSchema();
  const token = newToken();
  const redirectUrl = `${url.origin}/shop.html?success=1&product=${encodeURIComponent(id)}&t=${token}`;
  const r = await createRetainerLink({ name: item.name, amountCents: item.amountCents, redirectUrl, note: `Dot One Media shop: ${item.name}` });
  if (!r.url) return NextResponse.redirect(new URL(`/shop.html?error=${encodeURIComponent(r.error || "unavailable")}`, url.origin), 303);
  await sql`INSERT INTO shop_orders (token, product, square_order_id, status) VALUES (${token}, ${id}, ${r.orderId || ""}, 'pending')`;
  return NextResponse.redirect(r.url, 303);
}
