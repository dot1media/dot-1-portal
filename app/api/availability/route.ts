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

// Public: upcoming open days (today onward).
export async function GET() {
  try { await sql`ALTER TABLE availability ADD COLUMN IF NOT EXISTS service_id INTEGER`; } catch {}
  try { await sql`ALTER TABLE availability ADD COLUMN IF NOT EXISTS service_ids JSONB`; } catch {}
  try { await sql`UPDATE availability SET service_ids = to_jsonb(ARRAY[service_id]) WHERE service_id IS NOT NULL AND service_ids IS NULL`; } catch {}
  const rows = await sql`
    SELECT id,
           to_char(date, 'YYYY-MM-DD') AS date,
           to_char(start_time, 'HH24:MI') AS start,
           to_char(end_time, 'HH24:MI') AS end,
           COALESCE(service_ids, '[]'::jsonb) AS "serviceIds"
    FROM availability
    WHERE date >= CURRENT_DATE
    ORDER BY date, start_time`;
  return NextResponse.json({ availability: rows });
}

// Admin: open a day with a window.
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const date = String(b.date || "").trim();
  const start = String(b.start || "").trim();
  const end = String(b.end || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return NextResponse.json({ error: "Please provide a day, an open time, and a close time." }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "Close time must be after open time." }, { status: 400 });
  }
  try { await sql`ALTER TABLE availability ADD COLUMN IF NOT EXISTS service_ids JSONB`; } catch {}
  const serviceIds = Array.isArray(b.serviceIds) ? Array.from(new Set(b.serviceIds.map((x: any) => parseInt(String(x), 10)).filter((n: number) => !isNaN(n)))) : [];
  const rows = await sql`
    INSERT INTO availability (date, start_time, end_time, service_ids)
    VALUES (${date}::date, ${start}::time, ${end}::time, ${JSON.stringify(serviceIds)}::jsonb)
    RETURNING id,
              to_char(date, 'YYYY-MM-DD') AS date,
              to_char(start_time, 'HH24:MI') AS start,
              to_char(end_time, 'HH24:MI') AS end,
              COALESCE(service_ids, '[]'::jsonb) AS "serviceIds"`;
  return NextResponse.json({ slot: rows[0] });
}

// Admin: remove an open day.
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await sql`DELETE FROM availability WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

