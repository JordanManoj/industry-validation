import * as schema from "./schema";
import { SCHEMA_SQL } from "./schema-sql";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

// Same Postgres schema and SQL dialect in both places, so nothing changes in
// application code when DATABASE_URL points at a real hosted database.
// Locally (no DATABASE_URL) we run an embedded PGlite instance persisted to
// disk, so `npm run dev` works with zero external setup — no local Postgres,
// no cloud account, no migration step before you can click around.
//
// Table creation runs lazily on first use via the bootstrap DDL in
// schema-sql.ts (idempotent CREATE TABLE IF NOT EXISTS), so a fresh PGlite
// file or a fresh hosted database both bootstrap themselves. drizzle-kit is
// still wired up (drizzle.config.ts) for anyone who wants real tracked
// migrations against a hosted Postgres later — this bootstrap is just what
// makes the app work out of the box.

type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let cached: Promise<Db> | null = null;

async function build(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    // onnotice: silence the "already exists, skipping" NOTICEs the idempotent
    // bootstrap DDL emits on every cold start.
    const client = postgres(process.env.DATABASE_URL, { max: 5, onnotice: () => {} });
    await client.unsafe(SCHEMA_SQL);
    return drizzle(client, { schema }) as unknown as Db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite("./.pglite-data");
  await client.exec(SCHEMA_SQL);
  return drizzle(client, { schema }) as unknown as Db;
}

export async function getDb(): Promise<Db> {
  if (!cached) cached = build();
  return cached;
}
