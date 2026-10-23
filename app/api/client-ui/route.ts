import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";
import { getSetting, setSetting } from "@/lib/app-settings";

export const runtime = "nodejs";

// Which client experience is live: the new "redesign" or the previous "classic".
// GET is public so the client portal and the public booking flow can read the
// active mode. POST is studio-admin only — the admin toggle flips it, revertible
// at any time while we keep revising the redesign.

const KEY = "client_ui";
const VALID = ["redesign", "classic"];
const DEFAULT = "redesign";

export async function GET() {
  const mode = await getSetting(KEY, DEFAULT);
  return NextResponse.json({ mode: VALID.includes(mode) ? mode : DEFAULT });
}

export async function POST(request: Request) {
  const store = await cookies();
  const admin = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (!admin || !(await hasStudio())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const b = await request.json().catch(() => ({}));
  const mode = VALID.includes(b.mode) ? b.mode : DEFAULT;
  try {
    await setSetting(KEY, mode);
    return NextResponse.json({ ok: true, mode });
  } catch {
    return NextResponse.json({ error: "Could not save the setting." }, { status: 500 });
  }
}
