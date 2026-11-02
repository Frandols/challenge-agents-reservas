import { Router } from "express";
import { createAvailabilityController } from "../controllers/availability";
import { createReservationsController } from "../controllers/reservations";
import { createUnitsController } from "../controllers/units";
import type { Deps } from "../deps";

export function createRouter(deps: Deps) {
  const router = Router();
  const units = createUnitsController(deps);
  const availability = createAvailabilityController(deps);
  const reservations = createReservationsController(deps);

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  router.get("/units", units.list);
  router.get("/availability", availability.check);
  router.get("/reservations", reservations.list);
  router.post("/reservations", reservations.create);
  router.post("/reservations/:id/cancel", reservations.cancel);

  return router;
}
