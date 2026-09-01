import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureVideoSchema } from "@/lib/video";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  if (!b.reviewId) return NextResponse.json({ error: "Missing review." }, { status: 400 });
  await ensureVideoSchema();
  await sql`UPDATE video_reviews SET uploaded = true WHERE id = ${String(b.reviewId)}`;
  return NextResponse.json({ ok: true });
}
