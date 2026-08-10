import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// put() streams the request body, so run this on the Node.js runtime.
export const runtime = "nodejs";

export async function POST(request: Request) {
  // ---------------------------------------------------------------------------
  // TEMPORARY, NOT PRODUCTION-SAFE.
  // There is no auth yet, so we identify the user by an email passed from the
  // client. That means anyone could set anyone's avatar. Fine for local testing
  // against a real Neon row, but DO NOT expose this publicly until real
  // authentication gates this route (that is the next feature after this).
  // When auth exists, delete the email lookup and use the signed-in user's id.
  // ---------------------------------------------------------------------------
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) {
    return NextResponse.json(
      { error: "No user found with that email" },
      { status: 404 }
    );
  }
  const userId = users[0].id as string;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image" }, { status: 400 });
  }
  if (!request.body) {
    return NextResponse.json({ error: "Empty upload" }, { status: 400 });
  }

  // Upload to Vercel Blob (public URL, served over Vercel's CDN). A random
  // suffix gives a fresh URL each time so an updated photo is never masked by a
  // cached copy of the old one.
  const blob = await put(`avatars/${userId}.jpg`, request.body, {
    access: "public",
    contentType: "image/jpeg",
    addRandomSuffix: true,
  });

  await sql`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${userId}`;

  return NextResponse.json({ url: blob.url });
}
