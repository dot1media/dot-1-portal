import crypto from "crypto";

export const ADMIN_COOKIE = "dot1_admin";
export const CLIENT_COOKIE = "dot1_client";
const WEEK_MS = 1000 * 60 * 60 * 24 * 7;

function sign(payloadObj: object): string {
  const secret = process.env.SESSION_SECRET || "";
  const body = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}

function verify(token: string | undefined | null, role: string): { email: string; tier?: string; grants?: any } | null {
  const secret = process.env.SESSION_SECRET || "";
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const e = Buffer.from(expected);
  if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.role !== role || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    // tier and grants are optional extra claims (added with the suite hub). Older cookies and other
    // apps that don't read them keep working; consumers that want them read them here.
    return { email: String(payload.email || ""), tier: payload.tier, grants: payload.grants };
  } catch {
    return null;
  }
}

// makeToken optionally embeds the suite access claims (tier + per-app grants) so other apps can
// read a person's baseline role without calling back to the portal. Identity still verifies the
// same way for apps that ignore the extra claims.
export function makeToken(email: string, claims?: { tier?: string; grants?: any }): string {
  return sign({ role: "admin", email, tier: claims?.tier, grants: claims?.grants, exp: Date.now() + WEEK_MS });
}
export function verifyToken(token: string | undefined | null) {
  return verify(token, "admin");
}
export function makeClientToken(email: string): string {
  return sign({ role: "client", email, exp: Date.now() + WEEK_MS });
}
export function verifyClientToken(token: string | undefined | null) {
  return verify(token, "client");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return "scrypt$" + salt + "$" + hash;
}
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const test = crypto.scryptSync(password, parts[1], 64).toString("hex");
  const a = Buffer.from(parts[2], "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function calendarToken(): string {
  const secret = process.env.SESSION_SECRET || "";
  return crypto.createHmac("sha256", secret).update("dot1-calendar-feed").digest("hex").slice(0, 32);
}

export function makeResetToken(email: string): string {
  const secret = process.env.SESSION_SECRET || "";
  const payload = JSON.stringify({ role: "reset", email, exp: Date.now() + 1000 * 60 * 60 });
  const body = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}
export function verifyResetToken(token: string | undefined | null): { email: string } | null {
  const secret = process.env.SESSION_SECRET || "";
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig), e = Buffer.from(expected);
  if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.role !== "reset" || typeof p.exp !== "number" || Date.now() > p.exp) return null;
    return { email: String(p.email || "") };
  } catch { return null; }
}



export function makeInviteToken(email: string, name: string): string {
  const secret = process.env.SESSION_SECRET || "";
  const payload = JSON.stringify({ role: "invite", email, name, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  const body = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}
export function verifyInviteToken(token: string | undefined | null): { email: string; name: string } | null {
  const secret = process.env.SESSION_SECRET || "";
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig), e = Buffer.from(expected);
  if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.role !== "invite" || typeof p.exp !== "number" || Date.now() > p.exp) return null;
    return { email: String(p.email || ""), name: String(p.name || "") };
  } catch { return null; }
}

