import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { units } from "../db/schema";

export function listUnits(db: Db) {
  return db.select().from(units).orderBy(units.id).all();
}

export function unitExists(db: Db, id: string) {
  return db.select({ id: units.id }).from(units).where(eq(units.id, id)).get() !== undefined;
}
