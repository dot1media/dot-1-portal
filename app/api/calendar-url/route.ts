import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE, calendarToken } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  if (!(await hasStudio())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  return NextResponse.json({ url: "https://portal.dot1.media/api/calendar?token=" + calendarToken() });
}

