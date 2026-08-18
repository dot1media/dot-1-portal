import crypto from "crypto";

// Shared Square payment-link creation for invoice retainers.
// Returns the real failure reason instead of swallowing it: either the
// deployment is missing credentials (configured: false) or Square rejected
// the request (configured: true, error tells you exactly why).

export function squareBase(): string {
  return (process.env.SQUARE_ENV || "").trim() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

export async function createRetainerLink(opts: {
  name: string;
  amountCents: number;
  redirectUrl: string;
  note: string;
  buyerEmail?: string;
}): Promise<{ configured: boolean; url?: string; orderId?: string; error?: string }> {
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  const locationId = (process.env.SQUARE_LOCATION_ID || "").trim();
  if (!token || !locationId) {
    return { configured: false, error: "Square is not configured: SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID is missing in the deployment environment." };
  }
  const amount = Math.round(Number(opts.amountCents) || 0);
  if (amount < 100) {
    return { configured: true, error: "Square requires a minimum of $1.00, and this retainer comes to " + "$" + (amount / 100).toFixed(2) + ". Raise the invoice total to at least $2.00." };
  }
  try {
    const res = await fetch(squareBase() + "/v2/online-checkout/payment-links", {
      method: "POST",
      headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        quick_pay: { name: opts.name.slice(0, 60), price_money: { amount, currency: "USD" }, location_id: locationId },
        checkout_options: { redirect_url: opts.redirectUrl },
        payment_note: opts.note.slice(0, 200),
        ...(opts.buyerEmail ? { pre_populated_data: { buyer_email: opts.buyerEmail } } : {}),
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (res.ok && data.payment_link && data.payment_link.url) {
      return { configured: true, url: data.payment_link.url, orderId: data.payment_link.order_id || "" };
    }
    const e0 = data && Array.isArray(data.errors) && data.errors[0] ? data.errors[0] : null;
    const detail = e0
      ? (e0.code + (e0.detail ? ": " + e0.detail : "") + (e0.field ? " [" + e0.field + "]" : ""))
      : ("HTTP " + res.status + " " + JSON.stringify(data).slice(0, 180));
    return { configured: true, error: "Square rejected the payment link (" + detail + ")" };
  } catch (fe: any) {
    return { configured: true, error: "Could not reach Square: " + (fe && fe.message ? fe.message : String(fe)) };
  }
}
