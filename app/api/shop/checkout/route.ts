import { NextResponse } from "next/server";
import { createRetainerLink } from "@/lib/square-link";
import { SHOP_CATALOG, ensureShopSchema, newToken, getShopConfig } from "@/lib/shop";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = String(url.searchParams.get("product") || "");
  const item = SHOP_CATALOG[id];
  if (!item) return NextResponse.redirect(new URL("/shop.html?error=unknown", url.origin), 303);

  // Subscription path: use a configured Square subscription checkout link if set,
  // otherwise fall back to starting it with our team.
  if (url.searchParams.get("plan") === "sub") {
    const envUrl = process.env["SUBSCRIBE_URL_" + id.toUpperCase()];
    if (envUrl) return NextResponse.redirect(envUrl, 303);
    const cfg = await getShopConfig("sub:" + id);
    if (cfg && cfg.url) return NextResponse.redirect(cfg.url, 303);
    return NextResponse.redirect(new URL(`/shop.html?subscribe=${encodeURIComponent(id)}`, url.origin), 303);
  }
  await ensureShopSchema();
  const token = newToken();
  const redirectUrl = `${url.origin}/shop.html?success=1&product=${encodeURIComponent(id)}&t=${token}`;
  const r = await createRetainerLink({ name: item.name, amountCents: item.amountCents, redirectUrl, note: `Dot One Media shop: ${item.name}` });
  if (!r.url) return NextResponse.redirect(new URL(`/shop.html?error=${encodeURIComponent(r.error || "unavailable")}`, url.origin), 303);
  await sql`INSERT INTO shop_orders (token, product, square_order_id, status) VALUES (${token}, ${id}, ${r.orderId || ""}, 'pending')`;
  return NextResponse.redirect(r.url, 303);
}
