import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetData } from "./db/reset-data";
import { startServer } from "./server";

type Running = Awaited<ReturnType<typeof startServer>>;

let directory: string;
let databasePath: string;
let running: Running | undefined;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "reservas-"));
  databasePath = join(directory, "reservas.db");
});

afterEach(async () => {
  await running?.stop();
  running = undefined;
  rmSync(directory, { recursive: true, force: true });
});

async function start() {
  running = await startServer({ databasePath, port: 0, now: () => "2026-11-02T09:00" });
}

async function restart() {
  await stop();
  await start();
}

async function stop() {
  await running?.stop();
  running = undefined;
}

function url(path: string) {
  return `http://localhost:${running?.port}/api${path}`;
}

function post(path: string, body?: unknown) {
  return fetch(url(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function reserve(start: string, end: string) {
  return post("/reservations", { unitId: "MIC-01", requester: "Ada Pruebas", start, end });
}

async function listReservations() {
  const response = await fetch(url("/reservations"));
  const body = await response.json();

  return body.reservations;
}

describe("reinicio de la aplicación", () => {
  it("recupera reservas activas y canceladas, y siguen aplicando las reglas", async () => {
    await start();
    const active = await (await reserve("2026-11-10T10:00", "2026-11-10T11:00")).json();
    const toCancel = await (await reserve("2026-11-10T12:00", "2026-11-10T13:00")).json();
    const cancelled = await (await post(`/reservations/${toCancel.id}/cancel`)).json();

    await restart();

    expect(await listReservations()).toEqual([active, cancelled]);
    expect((await reserve("2026-11-10T10:30", "2026-11-10T11:30")).status).toBe(409);

    const reused = await (await reserve("2026-11-10T12:00", "2026-11-10T13:00")).json();
    expect(reused.id).toBe("RES-0003");
  });

  it("no duplica el inventario", async () => {
    await start();

    await restart();

    const { units } = await (await fetch(url("/units"))).json();
    expect(units).toHaveLength(5);
  });
});

describe("reinicio de datos", () => {
  it("borra las reservas, conserva el inventario y reinicia la numeración", async () => {
    await start();
    await reserve("2026-11-10T10:00", "2026-11-10T11:00");
    await stop();

    expect(resetData(databasePath)).toBe(1);

    await start();
    expect(await listReservations()).toEqual([]);

    const { units } = await (await fetch(url("/units"))).json();
    expect(units).toHaveLength(5);

    const created = await (await reserve("2026-11-10T10:00", "2026-11-10T11:00")).json();
    expect(created.id).toBe("RES-0001");
  });
});
