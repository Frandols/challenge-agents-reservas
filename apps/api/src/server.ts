import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { openDatabase } from "./db/client";
import type { Now } from "./lib/time";

export type ServerOptions = { databasePath: string; port: number; now: Now };

export function startServer({ databasePath, port, now }: ServerOptions) {
  const { db, close } = openDatabase(databasePath);
  const app = createApp({ db, now });

  return new Promise<{ port: number; stop: () => Promise<void> }>((resolve) => {
    const server = app.listen(port, () => {
      resolve({
        port: (server.address() as AddressInfo).port,
        stop: () =>
          new Promise((done) => {
            server.close(() => {
              close();
              done();
            });
          }),
      });
    });
  });
}
