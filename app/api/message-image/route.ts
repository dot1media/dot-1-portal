import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, verifyClientToken, ADMIN_COOKIE, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

async function whoami() {
  const store = await cookies();
  const admin = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (admin) return { role: "admin", email: admin.email };
  const client = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (client) return { role: "client", email: client.email };
  return null;
}

// Upload one image to attach to a portal message. Gated: a client may only
// attach to their own session; studio admins may attach to any. The client
// already downscales before upload, so this stays small and fast.
export async function POST(request: Request) {
  const me = await whoami();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = String(searchParams.get("session") || "");
  if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });

  const rows = (await sql`SELECT client_email FROM portal_sessions WHERE id = ${sessionId} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  if (me.role === "client" && String(rows[0].client_email || "").toLowerCase() !== me.email.toLowerCase()) {
    return NextResponse.json({ error: "Not your session." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) return NextResponse.json({ error: "Please upload an image." }, { status: 400 });
  if (!request.body) return NextResponse.json({ error: "Empty upload." }, { status: 400 });

  try {
    const blob = await put(`messages/${sessionId}/${Date.now()}.jpg`, request.body, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    return NextResponse.json({ error: "Upload failed: " + (e && e.message ? e.message : String(e)) }, { status: 500 });
  }
}
