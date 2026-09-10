import { NextResponse } from "next/server";
import { verifyMagicToken, makeClientToken, CLIENT_COOKIE } from "@/lib/auth";
export const runtime = "nodejs";
// Magic link from client emails. In-app browsers (DoorDash, Instagram, etc.) often drop
// Set-Cookie on a 302 redirect and mishandle service workers, which showed clients a
// "This page couldn't load" screen. So instead of redirecting, we set the cookie on THIS
// response and serve a tiny HTML page that navigates on itself, with a visible
// "open in your normal browser" escape hatch for embedded browsers that still misbehave.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const m = verifyMagicToken(token);
  const base = url.origin;
  const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
  if (!m || !m.email) {
    return new Response(page(base + "/?link=expired", "This link has expired", "Links stay active for two weeks. Please open your portal and sign in, or ask us for a fresh link.", base + "/", token, base), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }
  const dest = base + "/" + (m.sid ? "?open=" + encodeURIComponent(m.sid) : "");
  const res = new Response(page(dest, "Opening your portal…", "One moment while we sign you in.", dest, "", base), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  res.headers.append("Set-Cookie", `${CLIENT_COOKIE}=${makeClientToken(m.email)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`);
  return res;
}
function page(dest: string, title: string, sub: string, openHref: string, retryToken: string, base: string): string {
  const d = JSON.stringify(dest);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dot One Media</title><style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fbf8f2;color:#141210;font-family:Archivo,system-ui,sans-serif;padding:24px}
.card{max-width:420px;text-align:center}
.k{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#a4a094;margin-bottom:14px}
h1{font-family:Georgia,'Bodoni Moda',serif;font-size:26px;margin:0 0 10px}
p{font-size:14.5px;color:#57544d;line-height:1.55;margin:0 0 22px}
a.btn{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#e23b2e;border:none;border-radius:8px;padding:13px 24px;text-decoration:none}
.hint{font-size:12px;color:#a4a094;margin-top:18px;line-height:1.5}
</style></head><body><div class="card">
<div class="k">Dot One Media</div><h1>${title}</h1><p>${sub}</p>
<a class="btn" id="go" href="${dest}">Continue to your portal</a>
<div class="hint">If this screen doesn't move, tap the &#8942; menu and choose <b>Open in Safari</b> or <b>Open in Chrome</b>, then paste this address: <br><span style="font-family:'IBM Plex Mono',monospace;font-size:11px;word-break:break-all">${esc2(dest)}</span></div>
</div>
<script>try{setTimeout(function(){location.replace(${d});},350);}catch(e){location.href=${d};}</script>
</body></html>`;
}
function esc2(s: string) { return String(s).replace(/</g, "&lt;"); }
