import { createApp } from "./app";
import { openDatabase } from "./db/client";
import { systemNow } from "./lib/time";

const port = Number(process.env.PORT ?? 3001);
const { db } = openDatabase(":memory:");

createApp({ db, now: systemNow }).listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
