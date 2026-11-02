import type { Request, Response } from "express";
import type { Deps } from "../deps";
import { cancelReservation, createReservation, getReservations } from "../services/reservations";
import { parseCreateReservation, parseListReservationsQuery } from "../validators/reservations";

export function createReservationsController(deps: Deps) {
  return {
    list(req: Request, res: Response) {
      res.json({ reservations: getReservations(deps, parseListReservationsQuery(req.query)) });
    },
    create(req: Request, res: Response) {
      res.status(201).json(createReservation(deps, parseCreateReservation(req.body)));
    },
    cancel(req: Request<{ id: string }>, res: Response) {
      res.json(cancelReservation(deps, req.params.id));
    },
  };
}
