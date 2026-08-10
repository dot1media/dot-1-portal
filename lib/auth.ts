import crypto from "crypto";

export const ADMIN_COOKIE = "dot1_admin";
const WEEK_MS = 1000 * 60 * 60 * 24 * 7;

export function makeToken(email: string): string {
  const secret = process.env.SESSION_SECRET || "";
  const payload = JSON.stringify({ role: "admin", email, exp: Date.now() + WEEK_MS });
  const body = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}

export function verifyToken(token: string | undefined | null): { email: string } | null {
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
    if (payload.role !== "admin" || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return { email: String(payload.email || "") };
  } catch {
    return null;
  }
}

// Client password hashing (scrypt; no external dependency).
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

