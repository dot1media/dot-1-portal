import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const v = verifyToken(token);
  return NextResponse.json({ admin: !!v, email: v?.email || null });
}

