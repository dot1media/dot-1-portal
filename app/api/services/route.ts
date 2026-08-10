import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

async function isAdmin() {
  const store = await cookies();
  return !!verifyToken(store.get(ADMIN_COOKIE)?.value);
}

function mapService(r: any) {
  return {
    id: r.id,
    group: r.grp,
    category: r.category || "",
    name: r.name,
    description: r.description || "",
    price: (r.price_cents || 0) / 100,
    duration: r.duration_min,
    addonMode: r.addon_mode,
    addonIds: r.addon_ids || [],
    visible: r.visible !== false,
  };
}

export async function GET() {
  const services = await sql`
    SELECT id, grp, category, name, description, price_cents, duration_min, addon_mode, addon_ids, visible
    FROM services WHERE active = true ORDER BY grp, sort_order, name`;
  const addons = await sql`
    SELECT id, grp, name, price_cents, add_time_min, visible
    FROM addons WHERE active = true ORDER BY grp, sort_order, name`;
  return NextResponse.json({
    services: services.map(mapService),
    addons: addons.map((a: any) => ({ id: a.id, group: a.grp, name: a.name, price: (a.price_cents || 0) / 100, addTime: a.add_time_min || 0, visible: a.visible !== false })),
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const grp = String(b.group || "").trim();
  const name = String(b.name || "").trim();
  if (!grp || !name) return NextResponse.json({ error: "Group and name are required." }, { status: 400 });
  const priceCents = Math.round((Number(b.price) || 0) * 100);
  const addonMode = b.addonMode === "custom" ? "custom" : "group";
  const addonIds = JSON.stringify(Array.isArray(b.addonIds) ? b.addonIds : []);
  const category = b.category ? String(b.category).trim() : null;
  const visible = b.visible !== false;
  const duration = b.duration != null && b.duration !== "" ? Math.round(Number(b.duration)) : null;
  const rows = await sql`
    INSERT INTO services (grp, category, name, description, price_cents, duration_min, addon_mode, addon_ids, visible, active)
    VALUES (${grp}::service_group, ${category}, ${name}, ${String(b.description || "")}, ${priceCents}, ${duration}, ${addonMode}::addon_mode, ${addonIds}::jsonb, ${visible}, true)
    RETURNING id, grp, category, name, description, price_cents, duration_min, addon_mode, addon_ids, visible`;
  return NextResponse.json({ service: mapService(rows[0]) });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const cur = await sql`SELECT * FROM services WHERE id = ${id} LIMIT 1`;
  if (cur.length === 0) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  const c = cur[0];
  const name = b.name != null ? String(b.name).trim() : c.name;
  const description = b.description != null ? String(b.description) : c.description;
  const priceCents = b.price != null ? Math.round((Number(b.price) || 0) * 100) : c.price_cents;
  const category = b.category != null ? (String(b.category).trim() || null) : c.category;
  const addonMode = b.addonMode != null ? (b.addonMode === "custom" ? "custom" : "group") : c.addon_mode;
  const addonIds = b.addonIds != null ? JSON.stringify(Array.isArray(b.addonIds) ? b.addonIds : []) : JSON.stringify(c.addon_ids || []);
  const visible = b.visible != null ? !!b.visible : c.visible;
  const duration = b.duration != null ? (b.duration === "" ? null : Math.round(Number(b.duration))) : c.duration_min;
  const rows = await sql`
    UPDATE services SET category = ${category}, name = ${name}, description = ${description}, price_cents = ${priceCents}, duration_min = ${duration}, addon_mode = ${addonMode}::addon_mode, addon_ids = ${addonIds}::jsonb, visible = ${visible}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, grp, category, name, description, price_cents, duration_min, addon_mode, addon_ids, visible`;
  return NextResponse.json({ service: mapService(rows[0]) });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await sql`UPDATE services SET active = false, updated_at = now() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

