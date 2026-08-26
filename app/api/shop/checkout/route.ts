import { NextResponse } from "next/server";
import { createRetainerLink } from "@/lib/square-link";

export const runtime = "nodejs";

// Public storefront checkout. Mints a real Square payment link for a catalog
// item using the deployment's existing Square credentials, then redirects the
// buyer to Square-hosted checkout. Set your own prices here (amounts in cents).
const CATALOG: Record<string, { name: string; amountCents: number; digital?: boolean }> = {
  kit:      { name: "Studio Business Kit", amountCents: 4900, digital: true },
  film:     { name: "Brand Story Film deposit", amountCents: 50000 },
  portrait: { name: "Timeless Portrait Session deposit", amountCents: 15000 },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = String(url.searchParams.get("product") || "");
  const item = CATALOG[id];
  if (!item) return NextResponse.redirect(new URL("/shop.html?error=unknown", url.origin), 303);
  const redirectUrl = `${url.origin}/shop.html?success=1&product=${encodeURIComponent(id)}`;
  const r = await createRetainerLink({
    name: item.name,
    amountCents: item.amountCents,
    redirectUrl,
    note: `Dot One Media shop: ${item.name}`,
  });
  if (r.url) return NextResponse.redirect(r.url, 303);
  return NextResponse.redirect(new URL(`/shop.html?error=${encodeURIComponent(r.error || "unavailable")}`, url.origin), 303);
}
