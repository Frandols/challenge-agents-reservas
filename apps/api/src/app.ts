import express from "express";
import type { Deps } from "./deps";
import { errorHandler } from "./middlewares/error-handler";
import { createRouter } from "./routes";

export function createApp(deps: Deps) {
  const app = express();

  app.use(express.json());
  app.use("/api", createRouter(deps));
  app.use(errorHandler);

  return app;
}
