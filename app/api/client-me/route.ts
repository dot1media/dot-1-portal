import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  const v = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  return NextResponse.json({ client: !!v, email: v?.email || null });
}

