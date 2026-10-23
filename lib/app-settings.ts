import { sql } from "@/lib/db";

// Generic single-row-per-key app settings (feature flags, UI mode, etc.).
// Kept separate from brand_settings so flags don't churn the brand cache.

export async function ensureSettingsSchema() {
  await sql`CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`;
}

export async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    await ensureSettingsSchema();
    const r = (await sql`SELECT value FROM app_settings WHERE key = ${key} LIMIT 1`) as any[];
    if (r.length && r[0].value != null) return String(r[0].value);
  } catch {
    /* table may not exist yet or DB unreachable — fall back */
  }
  return fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSettingsSchema();
  await sql`INSERT INTO app_settings (key, value, updated_at)
    VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now()`;
}
