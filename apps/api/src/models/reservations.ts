import { and, eq, gt, lt, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db/client";
import { reservations } from "../db/schema";

export type ReservationRow = typeof reservations.$inferSelect;
export type NewReservationRow = typeof reservations.$inferInsert;

// Regla única de superposición: disponibilidad y creación la usan por igual.
// Las desigualdades son estrictas para que los turnos consecutivos no choquen.
export function findActiveOverlapping(db: Db, unitId: string, start: string, end: string): ReservationRow[] {
  return db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.unitId, unitId),
        eq(reservations.status, "active"),
        lt(reservations.startsAt, end),
        gt(reservations.endsAt, start),
      ),
    )
    .orderBy(reservations.startsAt)
    .all();
}

export function insertReservation(db: Db, values: NewReservationRow) {
  return db.insert(reservations).values(values).returning().get();
}

export function findReservation(db: Db, id: number) {
  return db.select().from(reservations).where(eq(reservations.id, id)).get();
}

export function markCancelled(db: Db, id: number, cancelledAt: string) {
  return db
    .update(reservations)
    .set({ status: "cancelled", cancelledAt })
    .where(eq(reservations.id, id))
    .returning()
    .get();
}

export function listReservations(
  db: Db,
  filters: { unitId?: string; status?: "active" | "cancelled"; from?: string; to?: string },
) {
  const conditions: SQL[] = [];

  if (filters.unitId) conditions.push(eq(reservations.unitId, filters.unitId));
  if (filters.status) conditions.push(eq(reservations.status, filters.status));
  if (filters.from && filters.to) {
    conditions.push(lt(reservations.startsAt, filters.to), gt(reservations.endsAt, filters.from));
  }

  return db
    .select()
    .from(reservations)
    .where(and(...conditions))
    .orderBy(reservations.startsAt, reservations.id)
    .all();
}

// Borra todas las reservas y reinicia la numeración. Solo lo usa `pnpm db:reset`.
export function deleteAllReservations(db: Db) {
  return db.transaction((tx) => {
    const { changes } = tx.delete(reservations).run();
    tx.run(sql`delete from sqlite_sequence where name = 'reservations'`);

    return changes;
  });
}
