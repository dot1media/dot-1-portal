import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";
import { fetchCameraPackages } from "@/lib/assetsDb";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  return NextResponse.json(await fetchCameraPackages());
}
