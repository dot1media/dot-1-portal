import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  if (!verifyToken(store.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const hasSquare = !!((process.env.SQUARE_ACCESS_TOKEN || "").trim() && (process.env.SQUARE_LOCATION_ID || "").trim());
  const squareMode = !hasSquare ? "off" : ((process.env.SQUARE_ENV || "").trim() === "sandbox" ? "sandbox" : "production");
  const emailOn = !!(process.env.RESEND_API_KEY || "").trim();
  return NextResponse.json({ squareMode, emailOn });
}

