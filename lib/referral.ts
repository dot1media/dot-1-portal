import { sql } from "@/lib/db";
let ensured = false;
export async function ensureReferralSchema() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS referral_codes (code TEXT PRIMARY KEY, client_email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS referrals (id TEXT PRIMARY KEY, code TEXT NOT NULL, referrer_email TEXT NOT NULL, referred_email TEXT, session_id TEXT, credit_cents INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now())`;
  ensured = true;
}
export function creditDollars(): number { const n = parseInt(process.env.REFERRAL_CREDIT || "25", 10); return Number.isNaN(n) ? 25 : Math.max(0, n); }
export function newCode(): string { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 7; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
