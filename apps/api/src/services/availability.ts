import type { Deps } from "../deps";
import { findActiveOverlapping } from "../models/reservations";
import { assertUnitExists, serializeReservation } from "./reservations";

export function checkAvailability(deps: Deps, query: { unitId: string; start: string; end: string }) {
  assertUnitExists(deps, query.unitId);

  const conflicts = findActiveOverlapping(deps.db, query.unitId, query.start, query.end);

  return { ...query, available: conflicts.length === 0, conflicts: conflicts.map(serializeReservation) };
}
