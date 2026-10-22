import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { sendEmail } from "@/lib/email";
import { ensureModelReleases, newId, newToken, publicRow } from "@/lib/model-release";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureModelReleases();
  const sessionId = new URL(request.url).searchParams.get("sessionId") || "";
  if (!sessionId) return NextResponse.json({ models: [] });
  const rows = (await sql`SELECT * FROM model_releases WHERE session_id = ${sessionId} ORDER BY created_at ASC`) as any[];
  return NextResponse.json({ models: rows.map(publicRow) });
}

export async function POST(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureModelReleases();
  const b = await request.json().catch(() => ({}));
  const action = String(b.action || "");
  const origin = new URL(request.url).origin;

  if (action === "add") {
    const sessionId = String(b.sessionId || "").slice(0, 80);
    const name = String(b.name || "").trim().slice(0, 120);
    const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
    const minor = !!b.minor;
    const guardianName = String(b.guardianName || "").trim().slice(0, 120);
    if (!sessionId || !name) return NextResponse.json({ error: "A session and a name are required." }, { status: 400 });
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "That email is not valid." }, { status: 400 });
    const id = newId(), token = newToken();
    await sql`INSERT INTO model_releases (id, token, session_id, name, email, minor, guardian_name)
      VALUES (${id}, ${token}, ${sessionId}, ${name}, ${email || null}, ${minor}, ${guardianName || null})`;
    const row = (await sql`SELECT * FROM model_releases WHERE id = ${id} LIMIT 1`) as any[];
    return NextResponse.json({ ok: true, model: publicRow(row[0]), signUrl: origin + "/sign-release/" + token });
  }

  if (action === "remove") {
    const id = String(b.id || "");
    await sql`DELETE FROM model_releases WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }

  if (action === "sendLink") {
    const id = String(b.id || "");
    const rows = (await sql`SELECT * FROM model_releases WHERE id = ${id} LIMIT 1`) as any[];
    if (!rows.length) return NextResponse.json({ error: "Release not found." }, { status: 404 });
    const r = rows[0];
    if (!r.email) return NextResponse.json({ error: "This person has no email. Download the PDF for them to sign instead." }, { status: 400 });
    const link = origin + "/sign-release/" + r.token;
    const who = r.minor ? (r.name + " (minor — a parent or guardian signs)") : r.name;
    const send = await sendEmail({
      to: r.email,
      subject: "Please sign your Dot One Media " + (r.minor ? "minor " : "") + "release",
      replyTo: "contact@dot1.media",
      html: `<div style="background:#fbf8f2;padding:32px 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
        <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #ece8e0;border-radius:12px;overflow:hidden">
          <div style="padding:22px 28px;border-bottom:2px solid #e23b2e"><img src="https://portal.dot1.media/dot1-logo.png" alt="Dot One Media" style="height:36px"></div>
          <div style="padding:26px 28px">
            <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:21px;color:#1a1a17">A quick signature is needed</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#33322d">Hi ${r.name.split(" ")[0]}, Dot One Media needs a signed ${r.minor ? "minor " : ""}media release for <b>${who}</b> before your session content can be used. It takes about a minute, right in your browser.</p>
            <div style="text-align:center;margin:18px 0"><a href="${link}" style="display:inline-block;background:#e23b2e;color:#fff;text-decoration:none;padding:13px 26px;border-radius:8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:bold">Review &amp; sign the release</a></div>
            <p style="margin:12px 0 0;font-size:12px;color:#6f6d65;text-align:center">Or paste this link: ${link}</p>
          </div>
          <div style="padding:14px 28px;border-top:1px solid #ece8e0;text-align:center"><p style="margin:0;font-size:11px;color:#9a988f">Dot One Media &middot; Create with purpose &middot; Wasilla, Alaska</p></div>
        </div></div>`,
    });
    if (!send.ok) return NextResponse.json({ error: send.error || "Could not send the email." }, { status: 502 });
    return NextResponse.json({ ok: true, signUrl: link });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
