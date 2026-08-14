import { sql } from "@/lib/db";

// Ensures the payments / receipts ledger exists with the full expected schema, regardless of
// whether (or which older version of) the migration was applied. Idempotent + safe to call often.
export async function ensureLedger() {
  await sql`CREATE TABLE IF NOT EXISTS payments (id text PRIMARY KEY)`;
  await sql`ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS session_id text,
    ADD COLUMN IF NOT EXISTS client_email text,
    ADD COLUMN IF NOT EXISTS client_name text,
    ADD COLUMN IF NOT EXISTS service text,
    ADD COLUMN IF NOT EXISTS kind text,
    ADD COLUMN IF NOT EXISTS amount_cents integer,
    ADD COLUMN IF NOT EXISTS currency text,
    ADD COLUMN IF NOT EXISTS card_brand text,
    ADD COLUMN IF NOT EXISTS card_last4 text,
    ADD COLUMN IF NOT EXISTS square_order_id text,
    ADD COLUMN IF NOT EXISTS square_payment_id text,
    ADD COLUMN IF NOT EXISTS paid_at timestamptz,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`;
  // Repair a legacy table whose id-holding columns are uuid-typed. The app uses TEXT ids
  // throughout (session ids like "ses_...", Square order/payment ids, and the receipt id),
  // so these columns must be text or every INSERT is rejected. Only alters columns that are
  // still uuid, so it's a no-op once repaired.
  const cols = (await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' AND column_name IN ('id','session_id','square_order_id','square_payment_id')`) as any[];
  const isUuid = (n: string) => cols.some((c: any) => c && c.column_name === n && c.data_type === "uuid");
  if (isUuid("id")) await sql`ALTER TABLE payments ALTER COLUMN id TYPE text USING id::text`;
  if (isUuid("session_id")) await sql`ALTER TABLE payments ALTER COLUMN session_id TYPE text USING session_id::text`;
  if (isUuid("square_order_id")) await sql`ALTER TABLE payments ALTER COLUMN square_order_id TYPE text USING square_order_id::text`;
  if (isUuid("square_payment_id")) await sql`ALTER TABLE payments ALTER COLUMN square_payment_id TYPE text USING square_payment_id::text`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS payments_order_uidx ON payments(square_order_id)`;
}

