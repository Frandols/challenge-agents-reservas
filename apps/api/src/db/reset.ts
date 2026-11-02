import { deleteAllReservations } from "../models/reservations";
import { databasePath, openDatabase } from "./client";

const path = databasePath();

if (!process.argv.includes("--yes")) {
  console.error(`Este comando BORRA TODAS LAS RESERVAS de ${path}, activas y canceladas.`);
  console.error("Para confirmar, ejecutá: pnpm db:reset --yes");
  process.exit(1);
}

const { db, close } = openDatabase(path);
const deleted = deleteAllReservations(db);
close();

console.log(`Se borraron ${deleted} reservas de ${path}. El inventario se conserva.`);
