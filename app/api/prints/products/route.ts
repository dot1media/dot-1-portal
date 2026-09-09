import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { products, ensurePrints } from "@/lib/prints";
export const runtime = "nodejs";
export async function GET() { const admin = await hasStudio(); return NextResponse.json({ products: (await products(!admin)).map((p) => ({ id: p.id, name: p.name, price: (Number(p.price_cents) || 0) / 100, active: !!p.active })) }); }
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensurePrints();
  const b: any = await req.json().catch(() => ({}));
  const list = Array.isArray(b.products) ? b.products : [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i]; const id = String(p.id || ("pr_" + Math.random().toString(36).slice(2, 8))); const name = String(p.name || "").trim().slice(0, 80); const cents = Math.round((Number(p.price) || 0) * 100);
    if (!name || cents < 0) continue;
    await sql`INSERT INTO print_products (id, name, price_cents, active, sort) VALUES (${id}, ${name}, ${cents}, ${p.active !== false}, ${i}) ON CONFLICT (id) DO UPDATE SET name = ${name}, price_cents = ${cents}, active = ${p.active !== false}, sort = ${i}`;
  }
  return NextResponse.json({ ok: true });
}
