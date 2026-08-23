// The Dot One suite access model, owned by the portal (the SSO origin).
//
// Two tiers of control, exactly as designed:
//   1. ACCOUNT TIER (owner / admin / user) decides who can manage accounts.
//   2. PER-APP GRANT (access yes/no + a role) decides which apps a person may enter and the
//      baseline role they carry into each. Each app may still fine-tune with its own overrides.
//
// The portal writes grants; apps read them (from the signed cookie or /api/suite/me). Owner is
// absolute: full access to every app and every account, and can never be locked out.

export type Tier = "owner" | "admin" | "user";

export interface AppDef {
  id: string;
  name: string;
  blurb: string;
  url: string; // empty = internal to the portal (the studio view)
  roles: string[]; // valid roles for this app, strongest first
}

// The three destinations on the hub. Studio is the portal's own admin view (internal, no URL).
export const SUITE_APPS: AppDef[] = [
  { id: "studio", name: "Studio", blurb: "Client portal: bookings, invoices, clients, sessions.", url: "", roles: ["admin", "manager", "viewer"] },
  { id: "assets", name: "Assets", blurb: "Equipment and software inventory and lifecycle.", url: "https://assets.dot1.media", roles: ["admin", "manager", "viewer"] },
  { id: "editorial", name: "Editorial", blurb: "Newsroom: stories, review, publishing, broadcast.", url: "https://editorial.dot1.media", roles: ["owner", "editor", "reporter", "producer", "viewer"] },
];

export function appDef(id: string): AppDef | undefined {
  return SUITE_APPS.find((a) => a.id === id);
}

export type Grant = { access: boolean; role: string };
export type Grants = Record<string, Grant>;

// A brand-new account starts with no app access; the owner grants what they need.
export function emptyGrants(): Grants {
  const g: Grants = {};
  for (const a of SUITE_APPS) g[a.id] = { access: false, role: a.roles[a.roles.length - 1] };
  return g;
}

// Full access to everything, used to backfill pre-existing accounts so nobody is locked out on
// upgrade, and as the effective grant for an owner.
export function fullGrants(): Grants {
  const g: Grants = {};
  for (const a of SUITE_APPS) g[a.id] = { access: true, role: a.roles[0] };
  return g;
}

// Normalize whatever is stored (or missing) into a complete, valid grants map.
export function normalizeGrants(raw: any): Grants {
  const base = emptyGrants();
  if (raw && typeof raw === "object") {
    for (const a of SUITE_APPS) {
      const r = raw[a.id];
      if (r && typeof r === "object") {
        base[a.id] = {
          access: !!r.access,
          role: a.roles.includes(r.role) ? r.role : a.roles[a.roles.length - 1],
        };
      }
    }
  }
  return base;
}

export interface SuiteAccount {
  email: string;
  name: string;
  tier: Tier;
  grants: Grants;
  disabled: boolean;
}

// Effective access, with owner bypass. An owner reaches every app at its strongest role.
export function canAccessApp(acct: Pick<SuiteAccount, "tier" | "grants" | "disabled">, appId: string): boolean {
  if (acct.disabled) return false;
  if (acct.tier === "owner") return true;
  return !!acct.grants?.[appId]?.access;
}

export function appRole(acct: Pick<SuiteAccount, "tier" | "grants">, appId: string): string | null {
  const def = appDef(appId);
  if (!def) return null;
  if (acct.tier === "owner") return def.roles[0];
  const g = acct.grants?.[appId];
  return g?.access ? g.role : null;
}

// Who may open the account manager. Owner and admin manage accounts; users cannot.
export function canManageAccounts(acct: Pick<SuiteAccount, "tier">): boolean {
  return acct.tier === "owner" || acct.tier === "admin";
}

// Only an owner may create or modify owners and admins; an admin may only manage plain users.
// This stops an admin from escalating themselves or minting other admins.
export function canEditTarget(actor: Pick<SuiteAccount, "tier">, targetTier: Tier): boolean {
  if (actor.tier === "owner") return true;
  if (actor.tier === "admin") return targetTier === "user";
  return false;
}

export const TIERS: { id: Tier; label: string; blurb: string }[] = [
  { id: "owner", label: "Owner", blurb: "Full control of every app and every account. Cannot be restricted." },
  { id: "admin", label: "Admin", blurb: "Manages user accounts. Reaches the apps they are granted." },
  { id: "user", label: "User", blurb: "Reaches only the apps granted to them. Cannot manage accounts." },
];
