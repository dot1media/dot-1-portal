import { NextResponse } from "next/server";
import { getBrandSettings, saveBrandSettings } from "@/lib/brand-settings";
import { hasStudio } from "@/lib/studioGuard";
export const runtime = "nodejs";

export async function GET() {
  const b = await getBrandSettings();
  return NextResponse.json(b);
}
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ ok: false, error: "Please sign in as the studio admin first." }, { status: 401 });
  const body: any = await req.json().catch(() => ({}));
  try {
    await saveBrandSettings({
      configured: true,
      orgName: body.orgName, tagline: body.tagline,
      accent: body.accent, background: body.background, paper: body.paper, ink: body.ink, line: body.line,
      logo: body.logo,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Could not save." }, { status: 500 });
  }
}
