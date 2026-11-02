import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { databasePath, openDatabase } from "./db/client";
import { systemNow } from "./lib/time";

const port = Number(process.env.PORT ?? 3001);
const { db, close } = openDatabase(databasePath());

const server = createApp({ db, now: systemNow }).listen(port, () => {
  const { port: actualPort } = server.address() as AddressInfo;
  console.log(`API escuchando en http://localhost:${actualPort}`);
});

function shutdown() {
  server.close(() => {
    close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
