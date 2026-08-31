import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { sql } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  if (!(await hasStudio())) return NextResponse.json({ error: "Sign in as the studio admin first." }, { status: 401 });
  let subscriptions = 0;
  try {
    await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (endpoint TEXT PRIMARY KEY, sub JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
    const r = (await sql`SELECT COUNT(*)::int AS n FROM push_subscriptions`) as any[];
    subscriptions = Number(r[0]?.n) || 0;
  } catch {}
  return NextResponse.json({
    vapidPublic: !!process.env.VAPID_PUBLIC_KEY,
    vapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
    subscriptions,
  });
}
