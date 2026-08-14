import { sql } from "@/lib/db";

// Ensures the payments / receipts ledger exists with the full expected schema, regardless of
// whether (or which older version of) the SQL migration was ever applied on this database.
// Idempotent and safe to call often. ADD COLUMN IF NOT EXISTS repairs a table created by an
// earlier schema that is missing newer columns (which would otherwise make INSERT throw).
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
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS payments_order_uidx ON payments(square_order_id)`;
}

