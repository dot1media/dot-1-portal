import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { notifyWaitlist } from "@/lib/waitlist";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const date = String(b.date || ""); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Missing date." }, { status: 400 });
  return NextResponse.json({ ok: true, notified: await notifyWaitlist(date) });
}
