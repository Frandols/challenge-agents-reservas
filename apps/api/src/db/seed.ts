import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Db } from "./client";
import { units } from "./schema";

const inventoryPath = fileURLToPath(new URL("../../data/units.json", import.meta.url));

export function seedUnits(db: Db) {
  const inventory: { id: string; name: string }[] = JSON.parse(readFileSync(inventoryPath, "utf8"));

  db.insert(units).values(inventory).onConflictDoNothing().run();
}
