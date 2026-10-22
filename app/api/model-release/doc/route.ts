import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { presignGet } from "@/lib/r2";
import { ensureModelReleases } from "@/lib/model-release";

export const runtime = "nodejs";

// Token-gated: the signed/uploaded release document. The token is the secret key,
// so both the signer and the studio (who holds the token in the admin list) can open it.
export async function GET(request: Request) {
  await ensureModelReleases();
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return new NextResponse("Missing token.", { status: 400 });
  const rows = (await sql`SELECT name, doc_key, uploaded FROM model_releases WHERE token = ${token} LIMIT 1`) as any[];
  if (!rows.length || !rows[0].doc_key) return new NextResponse("No signed document yet.", { status: 404 });
  try {
    const name = String(rows[0].name || "release").replace(/[^\w.-]+/g, "-") + "-release.pdf";
    const url = await presignGet(rows[0].doc_key, 3600, name);
    return NextResponse.redirect(url, 302);
  } catch (e) {
    return new NextResponse("The document is temporarily unavailable.", { status: 502 });
  }
}
