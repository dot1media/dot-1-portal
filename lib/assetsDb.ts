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
