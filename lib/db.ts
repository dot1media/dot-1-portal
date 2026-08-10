import { neon } from "@neondatabase/serverless";

// The pooled Neon connection string. When you attach Neon through Vercel it is
// added to the project automatically (usually as DATABASE_URL). If your
// integration named it differently, check Vercel -> Settings -> Environment
// Variables and update the name below to match.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Run `npx vercel env pull .env.local` to fetch it."
  );
}

// `sql` is a tagged-template query function. Values passed with ${} are
// parameterized, so this is safe from SQL injection. Example:
//   const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
export const sql = neon(process.env.DATABASE_URL);
