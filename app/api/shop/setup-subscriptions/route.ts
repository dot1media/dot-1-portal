import { NextResponse } from "next/server";
import { SHOP_CATALOG, getShopConfig, setShopConfig } from "@/lib/shop";
import { createPlanAndVariation, createSubscriptionLink } from "@/lib/square-subscriptions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const setupToken = (process.env.SHOP_SETUP_TOKEN || "").trim();
  if (!setupToken) return NextResponse.json({ error: "Set SHOP_SETUP_TOKEN in the environment, redeploy, then call this again." }, { status: 400 });
  if (url.searchParams.get("token") !== setupToken) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  const force = url.searchParams.get("force") === "1";

  const out: Record<string, any> = {};
  for (const p of ["studio", "newsroom"]) {
    const item: any = (SHOP_CATALOG as any)[p];
    if (!item || !item.subCents) { out[p] = { skipped: "no subscription price set" }; continue; }
    const existing = await getShopConfig("sub:" + p);
    if (existing && existing.url && !force) { out[p] = { url: existing.url, reused: true }; continue; }
    const name = item.name.replace(" (self-install)", "") + " Hosted";
    const plan = await createPlanAndVariation(name, item.subCents);
    if (plan.error) { out[p] = { error: plan.error }; continue; }
    const link = await createSubscriptionLink(name, item.subCents, plan.variationId as string);
    if (link.error) { out[p] = { error: link.error }; continue; }
    await setShopConfig("sub:" + p, { planId: plan.planId, variationId: plan.variationId, url: link.url });
    out[p] = { url: link.url, created: true };
  }
  return NextResponse.json({
    ok: true,
    results: out,
    note: "Subscribe buttons now use these links automatically. Re-run with &force=1 to recreate.",
  });
}
