import type { Request, Response } from "express";
import type { Deps } from "../deps";
import { checkAvailability } from "../services/availability";
import { parseAvailabilityQuery } from "../validators/reservations";

export function createAvailabilityController(deps: Deps) {
  return {
    check(req: Request, res: Response) {
      res.json(checkAvailability(deps, parseAvailabilityQuery(req.query)));
    },
  };
}
