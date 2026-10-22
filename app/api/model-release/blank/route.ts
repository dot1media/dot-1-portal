import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureModelReleases } from "@/lib/model-release";
import { buildReleasePdf } from "@/lib/release-pdf";

export const runtime = "nodejs";

// Studio-only: a print-and-sign release for a person with no email. Name is pre-filled;
// the signature line is left blank to sign by hand, then upload the scan.
export async function GET(request: Request) {
  if (!(await hasStudio())) return new NextResponse("Not authorized.", { status: 401 });
  await ensureModelReleases();
  const origin = new URL(request.url).origin;
  const token = new URL(request.url).searchParams.get("token") || "";
  const rows = (await sql`SELECT * FROM model_releases WHERE token = ${token} LIMIT 1`) as any[];
  if (!rows.length) return new NextResponse("Release not found.", { status: 404 });
  const r = rows[0];
  try {
    const pdf = await buildReleasePdf(origin, {
      type: (r.minor ? "minor_release" : "media_release") as any,
      name: r.minor ? (r.guardian_name || "") : r.name,
      email: r.email || "",
      childName: r.minor ? r.name : "",
      unsigned: true,
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + String(r.name || "release").replace(/[^\w.-]+/g, "-") + '-release.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new NextResponse("Could not build the PDF.", { status: 500 });
  }
}
