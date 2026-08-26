// One shape for every processor. An adapter returns a hosted checkout URL to
// send the buyer to, plus an order id we can later check for payment.
export type CheckoutInput = { name: string; amountCents: number; redirectUrl: string; note: string; buyerEmail?: string };
export type CheckoutResult = { configured: boolean; url?: string; orderId?: string; error?: string };
export function validEmail(raw?: string): string | undefined {
  const e = String(raw || "").trim().toLowerCase();
  if (e.length < 6 || e.length > 254 || /\s/.test(e) || e.indexOf("..") !== -1) return undefined;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e) ? e : undefined;
}
