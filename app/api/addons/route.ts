import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";

export const runtime = "nodejs";

async function isAdmin() {
  const store = await cookies();
  return await hasStudio();
}

function mapAddon(a: any) {
  return { id: a.id, group: a.grp, name: a.name, price: (a.price_cents || 0) / 100, addTime: a.add_time_min || 0, visible: a.visible !== false };
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const grp = String(b.group || "").trim();
  const name = String(b.name || "").trim();
  if (!grp || !name) return NextResponse.json({ error: "Group and name are required." }, { status: 400 });
  const priceCents = Math.round((Number(b.price) || 0) * 100);
  const addTime = b.addTime != null && b.addTime !== "" ? Math.round(Number(b.addTime)) : 0;
  const visible = b.visible !== false;
  const rows = await sql`
    INSERT INTO addons (grp, name, price_cents, add_time_min, visible, active)
    VALUES (${grp}::service_group, ${name}, ${priceCents}, ${addTime}, ${visible}, true)
    RETURNING id, grp, name, price_cents, add_time_min, visible`;
  return NextResponse.json({ addon: mapAddon(rows[0]) });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const cur = await sql`SELECT * FROM addons WHERE id = ${id} LIMIT 1`;
  if (cur.length === 0) return NextResponse.json({ error: "Add-on not found." }, { status: 404 });
  const c = cur[0];
  const name = b.name != null ? String(b.name).trim() : c.name;
  const priceCents = b.price != null ? Math.round((Number(b.price) || 0) * 100) : c.price_cents;
  const addTime = b.addTime != null ? (b.addTime === "" ? 0 : Math.round(Number(b.addTime))) : c.add_time_min;
  const visible = b.visible != null ? !!b.visible : c.visible;
  const rows = await sql`
    UPDATE addons SET name = ${name}, price_cents = ${priceCents}, add_time_min = ${addTime}, visible = ${visible}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, grp, name, price_cents, add_time_min, visible`;
  return NextResponse.json({ addon: mapAddon(rows[0]) });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await sql`UPDATE addons SET active = false, updated_at = now() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

