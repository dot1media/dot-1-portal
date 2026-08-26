import crypto from "crypto";
import { squareBase } from "@/lib/square-link";

const token = () => (process.env.SQUARE_ACCESS_TOKEN || "").trim();
const locationId = () => (process.env.SQUARE_LOCATION_ID || "").trim();

async function sq(path: string, body: any): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(squareBase() + path, {
    method: "POST",
    headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}
function sqErr(data: any): string {
  const e = data && Array.isArray(data.errors) && data.errors[0];
  return e ? (e.code + (e.detail ? ": " + e.detail : "") + (e.field ? " [" + e.field + "]" : "")) : JSON.stringify(data).slice(0, 200);
}

// Create a subscription plan and a single-phase monthly variation (static price).
export async function createPlanAndVariation(name: string, monthlyCents: number): Promise<{ planId?: string; variationId?: string; error?: string }> {
  if (!token()) return { error: "SQUARE_ACCESS_TOKEN is missing" };
  let r = await sq("/v2/catalog/object", {
    idempotency_key: crypto.randomUUID(),
    object: { type: "SUBSCRIPTION_PLAN", id: "#plan", subscription_plan_data: { name } },
  });
  if (!r.ok || !r.data.catalog_object) return { error: "Square plan error (" + sqErr(r.data) + ")" };
  const planId = r.data.catalog_object.id;
  r = await sq("/v2/catalog/object", {
    idempotency_key: crypto.randomUUID(),
    object: {
      type: "SUBSCRIPTION_PLAN_VARIATION", id: "#variation",
      subscription_plan_variation_data: {
        name: "Monthly", subscription_plan_id: planId,
        phases: [{ cadence: "MONTHLY", ordinal: 0, pricing: { type: "STATIC", price: { amount: monthlyCents, currency: "USD" } } }],
      },
    },
  });
  if (!r.ok || !r.data.catalog_object) return { error: "Square variation error (" + sqErr(r.data) + ")" };
  return { planId, variationId: r.data.catalog_object.id };
}

// Create a Square-hosted, reusable self-serve subscription checkout link.
export async function createSubscriptionLink(name: string, monthlyCents: number, variationId: string): Promise<{ url?: string; error?: string }> {
  if (!token() || !locationId()) return { error: "Square is not configured (token or location id missing)" };
  const r = await sq("/v2/online-checkout/payment-links", {
    idempotency_key: crypto.randomUUID(),
    quick_pay: { name: name.slice(0, 60), price_money: { amount: monthlyCents, currency: "USD" }, location_id: locationId() },
    checkout_options: { subscription_plan_id: variationId },
  });
  if (r.ok && r.data.payment_link && r.data.payment_link.url) return { url: r.data.payment_link.url };
  return { error: "Square payment link error (" + sqErr(r.data) + ")" };
}
