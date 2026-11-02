import { AppError } from "../errors/app-error";
import type { Deps } from "../deps";
import { nextDay } from "../lib/time";
import {
  findActiveOverlapping,
  findReservation,
  insertReservation,
  listReservations,
  markCancelled,
  type ReservationRow,
} from "../models/reservations";
import { unitExists } from "../models/units";

export function serializeReservation(row: ReservationRow) {
  return { ...row, id: formatId(row.id) };
}

function formatId(id: number) {
  return `RES-${String(id).padStart(4, "0")}`;
}

function parseId(id: string) {
  const match = /^RES-(\d+)$/.exec(id);

  return match ? Number(match[1]) : undefined;
}

export function assertUnitExists({ db }: Deps, unitId: string) {
  if (!unitExists(db, unitId)) {
    throw new AppError(404, "unit_not_found", `La unidad ${unitId} no está en el inventario.`);
  }
}

export function createReservation(
  deps: Deps,
  input: { unitId: string; requester: string; start: string; end: string },
) {
  const { db, now } = deps;
  const createdAt = now();

  if (input.start < createdAt) {
    throw new AppError(400, "start_in_past", "El inicio ya pasó. Elegí un horario futuro.");
  }

  // IMMEDIATE toma el bloqueo de escritura antes de verificar, para que
  // ninguna otra conexión inserte entre la consulta y el alta.
  return db.transaction(
    (tx) => {
      assertUnitExists({ ...deps, db: tx }, input.unitId);

      const conflicts = findActiveOverlapping(tx, input.unitId, input.start, input.end);

      if (conflicts.length > 0) {
        throw new AppError(
          409,
          "reservation_conflict",
          `${input.unitId} ya está reservada en ese horario.`,
          conflicts.map(serializeReservation),
        );
      }

      const row = insertReservation(tx, {
        unitId: input.unitId,
        requester: input.requester,
        startsAt: input.start,
        endsAt: input.end,
        status: "active",
        createdAt,
      });

      return serializeReservation(row);
    },
    { behavior: "immediate" },
  );
}

export function cancelReservation({ db, now }: Deps, id: string) {
  const numericId = parseId(id);
  const row = numericId === undefined ? undefined : findReservation(db, numericId);

  if (!row) {
    throw new AppError(404, "reservation_not_found", `La reserva ${id} no existe.`);
  }

  if (row.status === "cancelled") {
    throw new AppError(409, "already_cancelled", `La reserva ${id} ya estaba cancelada.`);
  }

  return serializeReservation(markCancelled(db, row.id, now())!);
}

export function getReservations(
  { db }: Deps,
  filters: { unitId?: string; status?: "active" | "cancelled"; date?: string },
) {
  const { date, ...rest } = filters;
  const range = date ? { from: `${date}T00:00`, to: `${nextDay(date)}T00:00` } : {};

  return listReservations(db, { ...rest, ...range }).map(serializeReservation);
}
