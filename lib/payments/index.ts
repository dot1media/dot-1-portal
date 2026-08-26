import { CheckoutInput, CheckoutResult } from "./types";

export function providerName(): string {
  return (process.env.PAYMENT_PROVIDER || "square").trim().toLowerCase();
}

// Verification, provider-aware. Square is checked inline by the callers that
// also build receipts; this covers the abstraction for all three.
export async function isPaid(orderId: string): Promise<boolean> {
  const p = providerName();
  if (p === "stripe") { const { stripeIsPaid } = await import("./stripe"); return stripeIsPaid(orderId); }
  if (p === "paypal") { const { paypalIsPaid } = await import("./paypal"); return paypalIsPaid(orderId); }
  const { squareIsPaid } = await import("./square"); return squareIsPaid(orderId);
}

export type { CheckoutInput, CheckoutResult };
