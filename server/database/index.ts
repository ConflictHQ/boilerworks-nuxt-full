import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function useDB() {
  if (!_db) {
    const config = useRuntimeConfig();
    const client = postgres(config.databaseUrl, {
      max: 10,
      idle_timeout: 20,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}
