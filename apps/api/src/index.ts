import { databasePath } from "./db/client";
import { systemNow } from "./lib/time";
import { startServer } from "./server";

const server = await startServer({
  databasePath: databasePath(),
  port: Number(process.env.PORT ?? 3001),
  now: systemNow,
});

console.log(`API escuchando en http://localhost:${server.port}`);

async function shutdown() {
  await server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
