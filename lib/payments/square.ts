// Square verification, matching the app's existing paid check.
export function squareBase(): string {
  return (process.env.SQUARE_ENV || "").trim() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}
export async function squareIsPaid(orderId: string): Promise<boolean> {
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  if (!token || !orderId) return false;
  try {
    const res = await fetch(squareBase() + "/v2/orders/" + orderId, {
      headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" },
    });
    const od: any = await res.json().catch(() => ({}));
    const o = od.order || {};
    return o.state === "COMPLETED" ||
      (Array.isArray(o.tenders) && o.tenders.length > 0) ||
      (o.net_amount_due_money && Number(o.net_amount_due_money.amount) === 0 && o.total_money && Number(o.total_money.amount) > 0);
  } catch { return false; }
}
