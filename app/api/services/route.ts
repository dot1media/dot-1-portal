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

let extrasEnsured = false;
const slugify = (v: any) => { const x = String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); return x || null; };

async function ensureServiceExtras() {
  if (extrasEnsured) return;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS package_id INTEGER`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS location_name TEXT`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS location_url TEXT`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS confirmation_message TEXT`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS slug TEXT`;
  extrasEnsured = true;
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
    padBefore: r.pad_before_min || 0,
    padAfter: r.pad_after_min || 0,
    addonMode: r.addon_mode,
    addonIds: r.addon_ids || [],
    visible: r.visible !== false,
    packageId: r.package_id != null ? r.package_id : null,
    location: r.location_name || "",
    locationUrl: r.location_url || "",
    confirmationMessage: r.confirmation_message || "",
    slug: r.slug || "",
  };
}

export async function GET() {
  await ensureServiceExtras();
  const services = await sql`
    SELECT id, grp, category, name, description, price_cents, duration_min, pad_before_min, pad_after_min, addon_mode, addon_ids, visible, package_id, location_name, location_url, confirmation_message, slug
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
  await ensureServiceExtras();
  const grp = String(b.group || "").trim();
  const name = String(b.name || "").trim();
  if (!grp || !name) return NextResponse.json({ error: "Group and name are required." }, { status: 400 });
  const priceCents = Math.round((Number(b.price) || 0) * 100);
  const addonMode = b.addonMode === "custom" ? "custom" : "group";
  const addonIds = JSON.stringify(Array.isArray(b.addonIds) ? b.addonIds : []);
  const category = b.category ? String(b.category).trim() : null;
  const visible = b.visible !== false;
  const duration = b.duration != null && b.duration !== "" ? Math.round(Number(b.duration)) : null;
  const padBefore = b.padBefore != null && b.padBefore !== "" ? Math.max(0, Math.round(Number(b.padBefore))) : 0;
  const padAfter = b.padAfter != null && b.padAfter !== "" ? Math.max(0, Math.round(Number(b.padAfter))) : 0;
  const packageId = b.packageId != null && b.packageId !== "" ? parseInt(String(b.packageId), 10) : null;
  const locName = b.location != null ? (String(b.location).trim() || null) : null;
  const locUrl = b.locationUrl != null ? (String(b.locationUrl).trim() || null) : null;
  const confMsg = b.confirmationMessage != null ? (String(b.confirmationMessage) || null) : null;
  const slug = slugify(b.slug);
  try {
    const rows = await sql`
      INSERT INTO services (grp, category, name, description, price_cents, duration_min, pad_before_min, pad_after_min, addon_mode, addon_ids, visible, package_id, location_name, location_url, confirmation_message, slug, active)
      VALUES (${grp}::service_group, ${category}, ${name}, ${String(b.description || "")}, ${priceCents}, ${duration}, ${padBefore}, ${padAfter}, ${addonMode}::addon_mode, ${addonIds}::jsonb, ${visible}, ${packageId}, ${locName}, ${locUrl}, ${confMsg}, ${slug}, true)
      RETURNING id, grp, category, name, description, price_cents, duration_min, pad_before_min, pad_after_min, addon_mode, addon_ids, visible, package_id, location_name, location_url, confirmation_message, slug`;
    return NextResponse.json({ service: mapService(rows[0]) });
  } catch (e: any) {
    return NextResponse.json({ error: "Save failed: " + (e && e.message ? e.message : String(e)) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  await ensureServiceExtras();
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
  const padBefore = b.padBefore != null ? (b.padBefore === "" ? 0 : Math.max(0, Math.round(Number(b.padBefore)))) : (c.pad_before_min || 0);
  const padAfter = b.padAfter != null ? (b.padAfter === "" ? 0 : Math.max(0, Math.round(Number(b.padAfter)))) : (c.pad_after_min || 0);
  const packageId = b.packageId !== undefined ? (b.packageId === "" || b.packageId === null ? null : parseInt(String(b.packageId), 10)) : c.package_id;
  const locName = b.location !== undefined ? (b.location ? String(b.location).trim() : null) : (c.location_name || null);
  const locUrl = b.locationUrl !== undefined ? (b.locationUrl ? String(b.locationUrl).trim() : null) : (c.location_url || null);
  const confMsg = b.confirmationMessage !== undefined ? (b.confirmationMessage ? String(b.confirmationMessage) : null) : (c.confirmation_message || null);
  const slug = b.slug !== undefined ? slugify(b.slug) : (c.slug || null);
  try {
    const rows = await sql`
      UPDATE services SET category = ${category}, name = ${name}, description = ${description}, price_cents = ${priceCents}, duration_min = ${duration}, pad_before_min = ${padBefore}, pad_after_min = ${padAfter}, addon_mode = ${addonMode}::addon_mode, addon_ids = ${addonIds}::jsonb, visible = ${visible}, package_id = ${packageId}, location_name = ${locName}, location_url = ${locUrl}, confirmation_message = ${confMsg}, slug = ${slug}, updated_at = now()
      WHERE id = ${id}
      RETURNING id, grp, category, name, description, price_cents, duration_min, pad_before_min, pad_after_min, addon_mode, addon_ids, visible, package_id, location_name, location_url, confirmation_message, slug`;
    return NextResponse.json({ service: mapService(rows[0]) });
  } catch (e: any) {
    return NextResponse.json({ error: "Save failed: " + (e && e.message ? e.message : String(e)) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await sql`UPDATE services SET active = false, updated_at = now() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

