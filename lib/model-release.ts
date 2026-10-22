import crypto from "crypto";
import { sql } from "@/lib/db";

// One release per person identified in a session. Not tied to a user account:
// models may be anyone photographed/filmed. Each row carries a secret token used
// for the e-sign link and for retrieving the signed document.

let ensured = false;
export async function ensureModelReleases() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS model_releases (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    minor BOOLEAN DEFAULT false,
    guardian_name TEXT,
    child_age TEXT,
    relationship TEXT,
    usage_option TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    signed_name TEXT,
    signed_at TIMESTAMPTZ,
    doc_key TEXT,
    uploaded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS model_releases_sid ON model_releases (session_id)`;
  ensured = true;
}

export function newId() { return "mrl_" + crypto.randomBytes(6).toString("hex"); }
export function newToken() { return "mr_" + crypto.randomBytes(14).toString("hex"); }

export function publicRow(r: any) {
  return {
    id: r.id, token: r.token, sessionId: r.session_id, name: r.name, email: r.email || "",
    minor: !!r.minor, guardianName: r.guardian_name || "", childAge: r.child_age || "",
    relationship: r.relationship || "", usageOption: r.usage_option || "", status: r.status,
    signedName: r.signed_name || "", signedAt: r.signed_at, uploaded: !!r.uploaded,
    hasDoc: !!r.doc_key,
  };
}
