import { databasePath } from "./client";
import { resetData } from "./reset-data";

const path = databasePath();

if (!process.argv.includes("--yes")) {
  console.error(`Este comando BORRA TODAS LAS RESERVAS de ${path}, activas y canceladas.`);
  console.error("Para confirmar, ejecutá: pnpm db:reset --yes");
  process.exit(1);
}

console.log(`Se borraron ${resetData(path)} reservas de ${path}. El inventario se conserva.`);
