import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { checkR2 } from "@/lib/r2";
export const runtime = "nodejs";
export async function GET() {
  if (!(await hasStudio())) return NextResponse.json({ error: "Sign in as the studio admin first." }, { status: 401 });
  return NextResponse.json(await checkR2());
}
