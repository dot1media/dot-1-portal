import { neon } from "@neondatabase/serverless";

// Read-only link to the assets app's Neon DB, where camera packages live.
// Configured via ASSETS_DATABASE_URL in the portal's Vercel env.
export async function fetchCameraPackages(): Promise<{ configured: boolean; packages: any[]; error?: string }> {
  const url = (process.env.ASSETS_DATABASE_URL || "").trim().replace(/^"|"$/g, "");
  if (!url) return { configured: false, packages: [] };
  try {
    const asql = neon(url);
    const exists = await asql`SELECT to_regclass('public.asset_packages') AS t`;
    if (!exists[0]?.t) return { configured: true, packages: [] };
    const rows = await asql`
      SELECT p.id, p.name, COALESCE(b.name, '') AS business_name, COALESCE(SUM(pi.quantity), 0)::int AS unit_count
      FROM asset_packages p
      LEFT JOIN asset_businesses b ON b.id = p.business_id
      LEFT JOIN asset_package_items pi ON pi.package_id = p.id
      GROUP BY p.id, b.name
      ORDER BY b.name, p.name`;
    return { configured: true, packages: rows };
  } catch (e: any) {
    return { configured: true, packages: [], error: String(e?.message || e) };
  }
}

// One package with its gear list — for the "Gear for this shoot" card on a studio session.
export async function fetchCameraPackage(id: number): Promise<{ configured: boolean; package: any | null; items: any[]; error?: string }> {
  const url = (process.env.ASSETS_DATABASE_URL || "").trim().replace(/^"|"$/g, "");
  if (!url) return { configured: false, package: null, items: [] };
  if (!Number.isFinite(id)) return { configured: true, package: null, items: [] };
  try {
    const asql = neon(url);
    const exists = await asql`SELECT to_regclass('public.asset_packages') AS t`;
    if (!exists[0]?.t) return { configured: true, package: null, items: [] };
    const pkg = await asql`SELECT id, name, COALESCE(description, '') AS description, COALESCE(session_types, '') AS session_types FROM asset_packages WHERE id = ${id} LIMIT 1`;
    if (!pkg.length) return { configured: true, package: null, items: [] };
    const items = await asql`
      SELECT pi.quantity, a.name, COALESCE(a.category, a.kind, '') AS category, a.quantity AS in_stock
      FROM asset_package_items pi JOIN assets a ON a.id = pi.asset_id
      WHERE pi.package_id = ${id} ORDER BY a.name`;
    return { configured: true, package: pkg[0], items };
  } catch (e: any) {
    return { configured: true, package: null, items: [], error: String(e?.message || e) };
  }
}
