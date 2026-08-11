import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, verifyClientToken, ADMIN_COOKIE, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const DEFAULT_THEME = { key: "default", accent: "" };

async function ownerFor(): Promise<string | null> {
  const store = await cookies();
  const admin = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (admin) return "__admin__";
  const client: any = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (client && client.email) return String(client.email).toLowerCase();
  return null;
}

export async function GET() {
  const owner = await ownerFor();
  if (!owner) return NextResponse.json({ theme: DEFAULT_THEME });
  try {
    const rows = (await sql`SELECT theme FROM theme_prefs WHERE owner = ${owner} LIMIT 1`) as any[];
    if (rows.length && rows[0].theme) return NextResponse.json({ theme: rows[0].theme });
  } catch (e) {}
  return NextResponse.json({ theme: DEFAULT_THEME });
}

export async function POST(request: Request) {
  const owner = await ownerFor();
  if (!owner) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const key = typeof b.key === "string" ? b.key.slice(0, 40) : "default";
  const accent = typeof b.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(b.accent) ? b.accent : "";
  const theme = { key, accent };
  try {
    await sql`INSERT INTO theme_prefs (owner, theme, updated_at)
      VALUES (${owner}, ${JSON.stringify(theme)}::jsonb, now())
      ON CONFLICT (owner) DO UPDATE SET theme = ${JSON.stringify(theme)}::jsonb, updated_at = now()`;
    return NextResponse.json({ ok: true, theme });
  } catch (e) {
    return NextResponse.json({ error: "Could not save your theme." }, { status: 500 });
  }
}

