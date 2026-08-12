import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const CATS = ["updates", "messages", "payments"];

// Client-controlled email preferences. Missing row = everything on.
export async function GET() {
  const store = await cookies();
  const client: any = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (!client || !client.email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const email = String(client.email).toLowerCase();
  let prefs: any = {};
  try { const rows = (await sql`SELECT prefs FROM email_prefs WHERE email = ${email} LIMIT 1`) as any[]; if (rows.length) prefs = rows[0].prefs || {}; } catch (e) {}
  const out: any = {};
  for (const c of CATS) out[c] = prefs[c] !== false;
  return NextResponse.json({ prefs: out });
}

export async function POST(request: Request) {
  const store = await cookies();
  const client: any = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (!client || !client.email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const email = String(client.email).toLowerCase();
  const body = await request.json().catch(() => ({}));
  const inPrefs = (body && body.prefs) || {};
  const prefs: any = {};
  for (const c of CATS) prefs[c] = inPrefs[c] !== false;
  try {
    await sql`INSERT INTO email_prefs (email, prefs, updated_at) VALUES (${email}, ${JSON.stringify(prefs)}::jsonb, now())
      ON CONFLICT (email) DO UPDATE SET prefs = EXCLUDED.prefs, updated_at = now()`;
  } catch (e) { return NextResponse.json({ error: "Could not save your preferences." }, { status: 500 }); }
  return NextResponse.json({ ok: true, prefs });
}

