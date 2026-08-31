import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { savePushSubscription, deletePushSubscription } from "@/lib/push";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Sign in as the studio admin first." }, { status: 401 });
  const body: any = await req.json().catch(() => ({}));
  if (!body || !body.endpoint) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  try { await savePushSubscription(body); return NextResponse.json({ ok: true }); }
  catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || "Could not save." }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const body: any = await req.json().catch(() => ({}));
  if (body && body.endpoint) { try { await deletePushSubscription(body.endpoint); } catch {} }
  return NextResponse.json({ ok: true });
}
