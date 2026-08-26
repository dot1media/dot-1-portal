import crypto from "crypto";

// Ed25519 licensing. The private signing key lives only in LICENSE_SIGNING_KEY
// (a pkcs8 PEM) in this deployment. The public key below ships in the sold apps,
// so they verify licenses offline and no one can forge one.
const LICENSE_PUBLIC_KEY_SPKI_B64 = "MCowBQYDK2VwAyEA0nT2V93qrEaNy6/mGDob+fXZSyjGCj4aUXaXCLH/wkA=";

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export function signLicense(payload: object): string | null {
  const pem = (process.env.LICENSE_SIGNING_KEY || "").trim();
  if (!pem) return null;
  try {
    const priv = crypto.createPrivateKey(pem);
    const data = Buffer.from(JSON.stringify(payload));
    const sig = crypto.sign(null, data, priv);
    return b64url(data) + "." + b64url(sig);
  } catch { return null; }
}

export function verifyLicense(key: string): { valid: boolean; payload?: any } {
  try {
    const [p, s] = String(key || "").split(".");
    if (!p || !s) return { valid: false };
    const data = fromB64url(p), sig = fromB64url(s);
    const pub = crypto.createPublicKey({ key: Buffer.from(LICENSE_PUBLIC_KEY_SPKI_B64, "base64"), format: "der", type: "spki" });
    if (!crypto.verify(null, data, pub, sig)) return { valid: false };
    const payload = JSON.parse(data.toString());
    if (payload.exp && Date.now() > payload.exp) return { valid: false };
    return { valid: true, payload };
  } catch { return { valid: false }; }
}
