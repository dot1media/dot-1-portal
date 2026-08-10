import { neon } from "@neondatabase/serverless";

// Trim whitespace and strip any stray surrounding quotes. Some environments
// store/export the value with extra quotes wrapped around it, which would make
// the connection string an invalid URL. This cleans that up defensively.
const raw = (process.env.DATABASE_URL ?? "").trim().replace(/^["']|["']$/g, "").trim();

if (!raw) {
  throw new Error(
    "DATABASE_URL is not set. Run `npx vercel env pull .env.local --environment=production`."
  );
}

// `sql` is a tagged-template query function. Values passed with ${} are
// parameterized, so this is safe from SQL injection. Example:
//   const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
export const sql = neon(raw);
