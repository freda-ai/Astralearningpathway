import "server-only";
import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { kenteSql?: ReturnType<typeof postgres> };

function client() {
  if (!globalForDb.kenteSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.kenteSql = postgres(url, { max: 10, prepare: false });
  }
  return globalForDb.kenteSql;
}

let _db: Db | undefined;
function rawDb(): Db {
  _db ??= drizzle(client(), { schema });
  return _db;
}

/**
 * Run `fn` as the given user with row-level security enforced.
 *
 * All reads and writes of workspace data must go through this. It sets the
 * same JWT claim Supabase uses for auth.uid() and switches to the
 * `authenticated` role for the duration of the transaction.
 */
export async function asUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return rawDb().transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" });
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}

/**
 * Privileged access that bypasses row-level security. Only for the auth
 * bootstrap (creating the users row, local credentials, invite lookup by
 * token). Never use it to read workspace data on behalf of a user.
 */
export function adminDb(): Db {
  return rawDb();
}

export { schema };
