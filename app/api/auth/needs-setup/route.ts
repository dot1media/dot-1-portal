import { NextResponse } from "next/server";
import { ensureAdminTable, adminCount } from "@/lib/admins";

export const runtime = "nodejs";

// Tells the login screen whether to show first-admin setup or normal sign-in.
export async function GET() {
  const configured = !!process.env.SESSION_SECRET;
  try {
    await ensureAdminTable();
    const n = await adminCount();
    return NextResponse.json({ configured, needsSetup: n === 0 });
  } catch (e: any) {
    return NextResponse.json({ configured, needsSetup: false, error: String(e?.message || e) });
  }
}
