import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({ error: { code: "invalid_json", message: "El cuerpo no es JSON válido." } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: "internal_error", message: "Ocurrió un error interno." } });
}
