import { CheckoutInput, CheckoutResult } from "./types";

function paypalBase(): string {
  return (process.env.PAYPAL_ENV || "live").trim() === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}
async function token(): Promise<string | null> {
  const id = (process.env.PAYPAL_CLIENT_ID || "").trim(), sec = (process.env.PAYPAL_SECRET || "").trim();
  if (!id || !sec) return null;
  try {
    const res = await fetch(paypalBase() + "/v1/oauth2/token", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(id + ":" + sec).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const d: any = await res.json().catch(() => ({})); return d.access_token || null;
  } catch { return null; }
}

export async function paypalCheckout(o: CheckoutInput): Promise<CheckoutResult> {
  const id = (process.env.PAYPAL_CLIENT_ID || "").trim(), sec = (process.env.PAYPAL_SECRET || "").trim();
  if (!id || !sec) return { configured: false, error: "PayPal is not configured: PAYPAL_CLIENT_ID or PAYPAL_SECRET is missing." };
  const tok = await token();
  if (!tok) return { configured: true, error: "PayPal authentication failed. Check your client id and secret." };
  try {
    const amount = Math.round(Number(o.amountCents) || 0);
    const res = await fetch(paypalBase() + "/v2/checkout/orders", {
      method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: (amount / 100).toFixed(2) }, description: (o.note || o.name).slice(0, 127) }],
        application_context: { return_url: o.redirectUrl, cancel_url: o.redirectUrl, shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
      }),
    });
    const d: any = await res.json().catch(() => ({}));
    const approve = Array.isArray(d.links) ? d.links.find((l: any) => l.rel === "approve") : null;
    if (res.ok && approve && approve.href) return { configured: true, url: approve.href, orderId: d.id };
    const detail = d && d.details && d.details[0] ? (d.details[0].issue || d.details[0].description) : (d.message || ("HTTP " + res.status));
    return { configured: true, error: "PayPal rejected the order (" + detail + ")" };
  } catch (fe: any) { return { configured: true, error: "Could not reach PayPal: " + (fe && fe.message ? fe.message : String(fe)) }; }
}

export async function paypalIsPaid(orderId: string): Promise<boolean> {
  if (!orderId) return false;
  const tok = await token(); if (!tok) return false;
  try {
    const res = await fetch(paypalBase() + "/v2/checkout/orders/" + orderId, { headers: { Authorization: "Bearer " + tok } });
    const d: any = await res.json().catch(() => ({}));
    if (d.status === "COMPLETED") return true;
    if (d.status === "APPROVED") {
      const cap = await fetch(paypalBase() + "/v2/checkout/orders/" + orderId + "/capture", { method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" } });
      const cd: any = await cap.json().catch(() => ({})); return cd.status === "COMPLETED";
    }
    return false;
  } catch { return false; }
}
