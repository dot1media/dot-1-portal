import { NextResponse } from "next/server";
import { Readable, PassThrough } from "stream";
import archiver from "archiver";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema, keyFull, currentClientEmail } from "@/lib/gallery";
import { getObjectStream } from "@/lib/r2";
export const runtime = "nodejs";
export const maxDuration = 60;
// Streams a zip of selected full-resolution photos. Built server-side so phones never hold the
// images in memory, and delivered as a normal attachment so Safari simply downloads it.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const galleryId = url.searchParams.get("galleryId") || "";
  const ids = String(url.searchParams.get("ids") || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 40);
  const part = url.searchParams.get("part") || "";
  if (!galleryId || !ids.length) return NextResponse.json({ error: "Nothing selected." }, { status: 400 });
  await ensureGallerySchema();
  const g = ((await sql`SELECT id, title, client_email FROM galleries WHERE id = ${galleryId} LIMIT 1`) as any[])[0];
  if (!g) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const admin = await hasStudio();
  if (!admin) { const em = await currentClientEmail(); if (!em || em !== String(g.client_email || "").toLowerCase()) return NextResponse.json({ error: "Not authorized." }, { status: 401 }); }
  const photos = (await sql`SELECT id, filename, favorite FROM gallery_photos WHERE gallery_id = ${galleryId} AND id = ANY(${ids})`) as any[];
  const allowed = photos.filter((p) => admin || p.favorite);
  if (!allowed.length) return NextResponse.json({ error: "Select photos to download them." }, { status: 403 });
  const archive = archiver("zip", { store: true });
  const out = new PassThrough();
  archive.on("error", () => { try { out.end(); } catch {} });
  archive.pipe(out);
  (async () => {
    const seen = new Set<string>();
    for (const p of allowed) {
      try {
        const { body } = await getObjectStream(keyFull(galleryId, p.id));
        let name = (p.filename || p.id + ".jpg").replace(/[\\/:*?"<>|]+/g, "-");
        if (seen.has(name)) name = name.replace(/(\.[a-z0-9]+)?$/i, "-" + p.id.slice(-4) + "$1"); seen.add(name);
        await new Promise<void>((resolve) => { const s = body as Readable; s.on("end", resolve); s.on("error", () => resolve()); archive.append(s, { name }); });
      } catch {}
    }
    await archive.finalize();
  })();
  const safe = String(g.title || "gallery").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "gallery";
  const fname = safe + (part ? "-part-" + part : "") + ".zip";
  return new Response(Readable.toWeb(out) as any, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${fname}"`, "Cache-Control": "no-store" } });
}
