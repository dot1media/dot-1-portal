import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { fetchCameraPackage } from "@/lib/assetsDb";

export const runtime = "nodejs";

// One camera package with its gear list, for the studio session "Gear for this shoot" card.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const id = parseInt((await params).id, 10);
  return NextResponse.json(await fetchCameraPackage(id));
}
