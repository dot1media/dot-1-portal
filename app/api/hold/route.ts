import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

const HOLD_MINUTES = 12;

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const date = String(b.date || "");
  const time = String(b.time || "");
  if (!date || !time) return NextResponse.json({ error: "Missing date or time." }, { status: 400 });
  const apptMin = Math.max(1, Math.round(Number(b.apptMin) || 60));
  const padBefore = Math.max(0, Math.round(Number(b.padBefore) || 0));
  const padAfter = Math.max(0, Math.round(Number(b.padAfter) || 0));
  const prev = String(b.holdId || "");
  try {
    await sql`DELETE FROM holds WHERE expires_at < now()`;
    if (prev) await sql`DELETE FROM holds WHERE id = ${prev}`;
    const id = "hold_" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60000).toISOString();
    await sql`INSERT INTO holds (id, date, time, appt_min, pad_before, pad_after, expires_at)
      VALUES (${id}, ${date}, ${time}, ${apptMin}, ${padBefore}, ${padAfter}, ${expiresAt})`;
    return NextResponse.json({ holdId: id });
  } catch (e: any) {
    // Non-fatal: if holds table is missing, booking still works (server-side commit check is the backstop).
    return NextResponse.json({ holdId: "" });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  try { if (id) await sql`DELETE FROM holds WHERE id = ${id}`; } catch (e) {}
  return NextResponse.json({ ok: true });
}

