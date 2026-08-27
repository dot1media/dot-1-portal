import { sql } from "@/lib/db";

export type BrandSettings = {
  configured: boolean;
  orgName?: string | null; tagline?: string | null;
  accent?: string | null; background?: string | null; paper?: string | null; ink?: string | null; line?: string | null;
  logo?: string | null;
};

let cache: { at: number; val: BrandSettings } | null = null;
const TTL = 30000;

export async function ensureBrandSchema() {
  await sql`CREATE TABLE IF NOT EXISTS brand_settings (
    id INTEGER PRIMARY KEY,
    org_name TEXT, tagline TEXT,
    accent TEXT, background TEXT, paper TEXT, ink TEXT, line TEXT,
    logo TEXT,
    configured BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`;
}

export async function getBrandSettings(): Promise<BrandSettings> {
  if (cache && Date.now() - cache.at < TTL) return cache.val;
  let val: BrandSettings = { configured: false };
  try {
    await ensureBrandSchema();
    const r = (await sql`SELECT * FROM brand_settings WHERE id = 1 LIMIT 1`) as any[];
    if (r.length) {
      const s = r[0];
      val = { configured: !!s.configured, orgName: s.org_name, tagline: s.tagline, accent: s.accent, background: s.background, paper: s.paper, ink: s.ink, line: s.line, logo: s.logo };
    }
  } catch { val = { configured: false }; }
  cache = { at: Date.now(), val };
  return val;
}

const isHex = (v?: string | null) => !!v && /^#[0-9a-fA-F]{3,8}$/.test(v);

export async function saveBrandSettings(b: BrandSettings) {
  await ensureBrandSchema();
  const accent = isHex(b.accent) ? b.accent : null;
  const background = isHex(b.background) ? b.background : null;
  const paper = isHex(b.paper) ? b.paper : null;
  const ink = isHex(b.ink) ? b.ink : null;
  const line = isHex(b.line) ? b.line : null;
  const logo = b.logo && /^data:image\/[a-z+]+;base64,/.test(b.logo) && b.logo.length < 600000 ? b.logo : null;
  await sql`INSERT INTO brand_settings (id, org_name, tagline, accent, background, paper, ink, line, logo, configured, updated_at)
    VALUES (1, ${b.orgName || null}, ${b.tagline || null}, ${accent}, ${background}, ${paper}, ${ink}, ${line}, ${logo}, true, now())
    ON CONFLICT (id) DO UPDATE SET org_name = ${b.orgName || null}, tagline = ${b.tagline || null}, accent = ${accent}, background = ${background}, paper = ${paper}, ink = ${ink}, line = ${line}, logo = ${logo}, configured = true, updated_at = now()`;
  cache = null;
}
