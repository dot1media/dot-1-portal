import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema } from "@/lib/gallery";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const galleryId = String(b.galleryId || "");
  if (!galleryId) return NextResponse.json({ error: "Missing gallery." }, { status: 400 });
  await ensureGallerySchema();
  const inc = b.included != null && String(b.included).trim() !== "" ? parseInt(String(b.included), 10) : null;
  await sql`UPDATE galleries SET included = ${inc != null && !Number.isNaN(inc) ? inc : null}${b.title !== undefined ? sql`, title = ${b.title || null}` : sql``} WHERE id = ${galleryId}`;
  return NextResponse.json({ ok: true });
}
