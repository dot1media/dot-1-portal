import { CheckoutInput, CheckoutResult, validEmail } from "./types";

export async function stripeCheckout(o: CheckoutInput): Promise<CheckoutResult> {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return { configured: false, error: "Stripe is not configured: STRIPE_SECRET_KEY is missing." };
  const amount = Math.round(Number(o.amountCents) || 0);
  if (amount < 50) return { configured: true, error: "Stripe requires at least $0.50." };
  try {
    const b = new URLSearchParams();
    b.set("mode", "payment");
    b.set("success_url", o.redirectUrl);
    b.set("cancel_url", o.redirectUrl);
    b.set("line_items[0][quantity]", "1");
    b.set("line_items[0][price_data][currency]", "usd");
    b.set("line_items[0][price_data][unit_amount]", String(amount));
    b.set("line_items[0][price_data][product_data][name]", o.name.slice(0, 120));
    const em = validEmail(o.buyerEmail); if (em) b.set("customer_email", em);
    if (o.note) b.set("payment_intent_data[description]", o.note.slice(0, 200));
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" }, body: b.toString(),
    });
    const d: any = await res.json().catch(() => ({}));
    if (res.ok && d.url) return { configured: true, url: d.url, orderId: d.id };
    const detail = d && d.error ? (d.error.message || d.error.type) : ("HTTP " + res.status);
    return { configured: true, error: "Stripe rejected the checkout (" + detail + ")" };
  } catch (fe: any) { return { configured: true, error: "Could not reach Stripe: " + (fe && fe.message ? fe.message : String(fe)) }; }
}

export async function stripeIsPaid(orderId: string): Promise<boolean> {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key || !orderId) return false;
  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions/" + orderId, { headers: { Authorization: "Bearer " + key } });
    const d: any = await res.json().catch(() => ({}));
    return !!(d && (d.payment_status === "paid" || d.status === "complete"));
  } catch { return false; }
}
