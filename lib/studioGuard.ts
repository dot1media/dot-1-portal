import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { ensureAdminTable, getSuiteAccount } from "@/lib/admins";
import { canAccessApp, type SuiteAccount } from "@/lib/suite";

// Studio access gate for the portal's own admin APIs. The hub decides which tiles a person sees,
// but that is UI only; these helpers enforce it at the data layer so a domain account without the
// Studio grant cannot read or change studio data even by calling the API directly. Access is read
// fresh from the DB (same app, cheap) so a revoked or disabled account is locked out at once, not
// at cookie expiry. Owner bypasses, as everywhere.

export async function requireStudioAccount(): Promise<SuiteAccount | null> {
  const store = await cookies();
  const v = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (!v?.email) return null;
  await ensureAdminTable();
  const acct = await getSuiteAccount(v.email);
  if (!acct || acct.disabled) return null;
  if (!canAccessApp(acct, "studio")) return null;
  return acct;
}

export async function hasStudio(): Promise<boolean> {
  return !!(await requireStudioAccount());
}
