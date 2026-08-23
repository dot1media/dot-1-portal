import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { ensureAdminTable, getSuiteAccount } from "@/lib/admins";
import { SUITE_APPS, canAccessApp, appRole, canManageAccounts } from "@/lib/suite";

export const runtime = "nodejs";

// Who am I across the suite, resolved fresh from the DB so the hub and any app that calls this
// always sees current access (not the possibly-week-old cookie snapshot). Returns the apps this
// account may enter, each with the baseline role it carries in.
export async function GET() {
  const store = await cookies();
  const v = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (!v) return NextResponse.json({ signedIn: false }, { status: 401 });

  await ensureAdminTable();
  const acct = await getSuiteAccount(v.email);
  if (!acct || acct.disabled) return NextResponse.json({ signedIn: false }, { status: 401 });

  const apps = SUITE_APPS
    .filter((a) => canAccessApp(acct, a.id))
    .map((a) => ({ id: a.id, name: a.name, blurb: a.blurb, url: a.url, role: appRole(acct, a.id) }));

  return NextResponse.json({
    signedIn: true,
    email: acct.email,
    name: acct.name,
    tier: acct.tier,
    canManageAccounts: canManageAccounts(acct),
    apps,
  });
}
