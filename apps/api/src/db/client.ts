import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database, { type RunResult } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";
import { seedUnits } from "./seed";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

const defaultDatabasePath = fileURLToPath(new URL("../../data/reservas.db", import.meta.url));

export function databasePath() {
  return process.env.DATABASE_PATH ?? defaultDatabasePath;
}

export function openDatabase(path: string) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });

  const sqlite = new Database(path);
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  seedUnits(db);

  return { db, close: () => sqlite.close() };
}

export type Db = BaseSQLiteDatabase<
  "sync",
  RunResult,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
