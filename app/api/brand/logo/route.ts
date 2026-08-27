import { NextResponse } from "next/server";
import { getBrandSettings } from "@/lib/brand-settings";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const b = await getBrandSettings();
  if (b.configured && b.logo) {
    const m = b.logo.match(/^data:([^;]+);base64,(.*)$/);
    if (m) {
      const buf = Buffer.from(m[2], "base64");
      return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=60" } });
    }
  }
  return NextResponse.redirect(new URL("/dot1-logo.png", req.url));
}
