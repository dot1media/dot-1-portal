import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE, calendarToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  if (!verifyToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  return NextResponse.json({ url: "https://portal.dot1.media/api/calendar?token=" + calendarToken() });
}

