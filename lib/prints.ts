import { sql } from "@/lib/db";
export const DEFAULT_PRODUCTS = [
  { id: "p4x6", name: "4×6 print", priceCents: 800 }, { id: "p5x7", name: "5×7 print", priceCents: 1200 }, { id: "p8x10", name: "8×10 print", priceCents: 2500 },
  { id: "p11x14", name: "11×14 print", priceCents: 4500 }, { id: "p16x20", name: "16×20 print", priceCents: 8500 }, { id: "c16x20", name: "16×20 canvas", priceCents: 16500 },
];
export async function ensurePrints() {
  await sql`CREATE TABLE IF NOT EXISTS print_products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price_cents INT NOT NULL, active BOOLEAN DEFAULT true, sort INT DEFAULT 0)`;
  await sql`CREATE TABLE IF NOT EXISTS print_orders (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, gallery_id TEXT, client_email TEXT, charge_id TEXT, items JSONB NOT NULL, total_cents INT NOT NULL, shipping JSONB, fulfilled_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now())`;
  const n = ((await sql`SELECT COUNT(*)::int AS n FROM print_products`) as any[])[0];
  if (!Number(n?.n)) for (let i = 0; i < DEFAULT_PRODUCTS.length; i++) { const p = DEFAULT_PRODUCTS[i]; await sql`INSERT INTO print_products (id, name, price_cents, sort) VALUES (${p.id}, ${p.name}, ${p.priceCents}, ${i}) ON CONFLICT DO NOTHING`; }
}
export async function products(activeOnly = true) { await ensurePrints(); return (activeOnly ? await sql`SELECT id, name, price_cents, active FROM print_products WHERE active = true ORDER BY sort, name` : await sql`SELECT id, name, price_cents, active FROM print_products ORDER BY sort, name`) as any[]; }
