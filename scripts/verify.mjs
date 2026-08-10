import fs from "node:fs";

let fail = 0;
const ok = (m) => console.log("  \u2713 " + m);
const bad = (m) => {
  console.log("  \u2717 " + m);
  fail++;
};

console.log("\n1. Required files");
for (const f of [
  "lib/db.ts",
  "app/api/avatar/route.ts",
  "app/page.tsx",
  "app/uploader.tsx",
  "package.json",
]) {
  fs.existsSync(f) ? ok(f) : bad(f + " is missing");
}

console.log("\n2. Environment (.env.local)");
const env = {};
if (!fs.existsSync(".env.local")) {
  bad(".env.local not found -- run: npx vercel env pull .env.local");
} else {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  env.DATABASE_URL
    ? ok("DATABASE_URL present")
    : bad("DATABASE_URL missing from .env.local");
  env.BLOB_READ_WRITE_TOKEN
    ? ok("BLOB_READ_WRITE_TOKEN present")
    : bad("BLOB_READ_WRITE_TOKEN missing from .env.local");
}

console.log("\n3. Neon database");
if (env.DATABASE_URL) {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(env.DATABASE_URL);
    const col = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url'`;
    col.length
      ? ok("users.avatar_url column exists")
      : bad("users table found but avatar_url column missing -- re-run the schema");
    const admins = await sql`SELECT email FROM users WHERE role = 'admin' ORDER BY email`;
    ok(
      "connected -- " +
        admins.length +
        " admin user(s): " +
        admins.map((a) => a.email).join(", ")
    );
  } catch (e) {
    bad("could not query Neon: " + e.message);
  }
} else {
  bad("skipped (no DATABASE_URL)");
}

console.log(
  "\n" +
    (fail === 0
      ? "All checks passed. Run `npm run dev` and open http://localhost:3000"
      : fail + " check(s) failed -- see above.")
);
process.exit(fail === 0 ? 0 : 1);
