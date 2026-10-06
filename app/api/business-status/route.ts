import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";
import { clientEmailsEnabled, setClientEmailsEnabled } from "@/lib/email-flags";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const hasSquare = !!((process.env.SQUARE_ACCESS_TOKEN || "").trim() && (process.env.SQUARE_LOCATION_ID || "").trim());
  const squareMode = !hasSquare ? "off" : ((process.env.SQUARE_ENV || "").trim() === "sandbox" ? "sandbox" : "production");
  const emailOn = !!(process.env.RESEND_API_KEY || "").trim();
  const clientEmails = await clientEmailsEnabled();
  return NextResponse.json({ squareMode, emailOn, clientEmails });
}

// Toggle the global client-email switch (admin only). Body: { clientEmails: boolean }.
export async function POST(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.clientEmails !== "boolean") {
    return NextResponse.json({ error: "clientEmails (boolean) is required." }, { status: 400 });
  }
  await setClientEmailsEnabled(body.clientEmails);
  return NextResponse.json({ ok: true, clientEmails: body.clientEmails });
}
