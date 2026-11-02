import { deleteAllReservations } from "../models/reservations";
import { openDatabase } from "./client";

export function resetData(path: string) {
  const { db, close } = openDatabase(path);
  const deleted = deleteAllReservations(db);
  close();

  return deleted;
}
