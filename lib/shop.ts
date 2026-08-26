import { sql } from "@/lib/db";
import crypto from "crypto";

// Storefront catalog. Prices in cents. `file` names the gated download in /private-downloads.
export const SHOP_CATALOG: Record<string, { name: string; amountCents: number; file?: string; digital: boolean; licensed?: boolean }> = {
  kit:       { name: "Studio Business Kit", amountCents: 4900, file: "studio-kit-deliverables.zip", digital: true },
  studiokit: { name: "Dot One Studio and Newsroom (self-install)", amountCents: 29900, file: "dot-one-studio-kit.zip", digital: true, licensed: true },
  film:      { name: "Brand Story Film deposit", amountCents: 50000, digital: false },
  portrait:  { name: "Timeless Portrait Session deposit", amountCents: 15000, digital: false },
};

export async function ensureShopSchema() {
  await sql`CREATE TABLE IF NOT EXISTS shop_orders (
    token TEXT PRIMARY KEY,
    product TEXT NOT NULL,
    square_order_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    license TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS license TEXT`;
}

export function newToken() { return crypto.randomBytes(24).toString("hex"); }

export function squareBase() {
  return (process.env.SQUARE_ENV || "").trim() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

// Source of truth: ask Square whether the order is actually paid.
export async function isOrderPaid(orderId: string): Promise<boolean> {
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  if (!token || !orderId) return false;
  try {
    const res = await fetch(squareBase() + "/v2/orders/" + orderId, {
      headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" },
    });
    const od: any = await res.json().catch(() => ({}));
    const o = od.order || {};
    return o.state === "COMPLETED" ||
      (Array.isArray(o.tenders) && o.tenders.length > 0) ||
      (o.net_amount_due_money && Number(o.net_amount_due_money.amount) === 0 && o.total_money && Number(o.total_money.amount) > 0);
  } catch { return false; }
}
