import type { Request, Response } from "express";
import type { Deps } from "../deps";
import { listUnits } from "../models/units";

export function createUnitsController({ db }: Deps) {
  return {
    list(_req: Request, res: Response) {
      res.json({ units: listUnits(db) });
    },
  };
}
