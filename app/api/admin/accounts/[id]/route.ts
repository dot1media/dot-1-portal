import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";
import { ensureAdminTable, adminCount, ownerCount, getSuiteAccount, getAccountById, updateAccountAccess } from "@/lib/admins";
import { canManageAccounts, canEditTarget, normalizeGrants, type Tier } from "@/lib/suite";

export const runtime = "nodejs";

async function actor() {
  const store = await cookies();
  const v = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (!v) return null;
  await ensureAdminTable();
  return await getSuiteAccount(v.email);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await actor();
  if (!me || !canManageAccounts(me)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await ctx.params;
  const target = await getAccountById(parseInt(id, 10));
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!canEditTarget(me, target.tier as Tier)) return NextResponse.json({ error: "Only an owner can remove an owner or admin." }, { status: 403 });
  if (target.email === me.email) return NextResponse.json({ error: "You can't remove the account you're signed in with." }, { status: 400 });
  if ((await adminCount()) <= 1) return NextResponse.json({ error: "Can't remove the last account." }, { status: 400 });
  if (target.tier === "owner" && (await ownerCount()) <= 1) return NextResponse.json({ error: "Can't remove the last owner." }, { status: 400 });
  await sql`DELETE FROM admin_accounts WHERE id = ${parseInt(id, 10)}`;
  return NextResponse.json({ ok: true });
}

// PATCH handles both a password reset and an access change (tier / grants / disabled).
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await actor();
  if (!me || !canManageAccounts(me)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await ctx.params;
  const target = await getAccountById(parseInt(id, 10));
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await request.json().catch(() => ({}));

  // Password reset path.
  if (typeof b.password === "string") {
    if (!canEditTarget(me, target.tier as Tier)) return NextResponse.json({ error: "Only an owner can reset an owner or admin." }, { status: 403 });
    if (b.password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    await sql`UPDATE admin_accounts SET password_hash = ${hashPassword(b.password)} WHERE id = ${parseInt(id, 10)}`;
    return NextResponse.json({ ok: true });
  }

  // Access change path (tier / grants / disabled).
  const newTier = (["owner", "admin", "user"].includes(b.tier) ? b.tier : target.tier) as Tier;
  const grants = normalizeGrants(b.grants ?? target.grants);
  const disabled = typeof b.disabled === "boolean" ? b.disabled : !!target.disabled;

  // The actor must be allowed to touch both the current and the intended tier (no escalation).
  if (!canEditTarget(me, target.tier as Tier) || !canEditTarget(me, newTier)) {
    return NextResponse.json({ error: "Only an owner can change owner or admin access." }, { status: 403 });
  }
  // Never let the suite lose its last owner.
  if (target.tier === "owner" && newTier !== "owner" && (await ownerCount()) <= 1) {
    return NextResponse.json({ error: "Can't demote the last owner." }, { status: 400 });
  }
  if (target.email === me.email && disabled) {
    return NextResponse.json({ error: "You can't disable the account you're signed in with." }, { status: 400 });
  }

  await updateAccountAccess(parseInt(id, 10), newTier, grants, disabled);
  return NextResponse.json({ ok: true });
}
