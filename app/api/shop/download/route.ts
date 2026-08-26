import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { SHOP_CATALOG, ensureShopSchema, isOrderPaid } from "@/lib/shop";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const t = String(new URL(req.url).searchParams.get("t") || "");
  if (!t) return new NextResponse("Missing token.", { status: 400 });
  await ensureShopSchema();
  const rows = (await sql`SELECT product, square_order_id, status FROM shop_orders WHERE token = ${t} LIMIT 1`) as any[];
  if (!rows.length) return new NextResponse("Not found.", { status: 404 });
  const row = rows[0];
  const item = SHOP_CATALOG[row.product];
  if (!item || !item.digital || !item.file) return new NextResponse("No download for this item.", { status: 400 });
  const paid = row.status === "paid" || (await isOrderPaid(row.square_order_id));
  if (!paid) return new NextResponse("Payment not confirmed yet.", { status: 402 });
  const filePath = path.join(process.cwd(), "private-downloads", item.file);
  if (!fs.existsSync(filePath)) return new NextResponse("File unavailable.", { status: 404 });
  const buf = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(buf), { status: 200, headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${item.file}"`,
  }});
}
