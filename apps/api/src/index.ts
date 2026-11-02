import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { openDatabase } from "./db/client";
import { systemNow } from "./lib/time";

const port = Number(process.env.PORT ?? 3001);
const { db } = openDatabase(":memory:");

const server = createApp({ db, now: systemNow }).listen(port, () => {
  const { port: actualPort } = server.address() as AddressInfo;
  console.log(`API escuchando en http://localhost:${actualPort}`);
});
