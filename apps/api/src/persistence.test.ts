import { type ChildProcess, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const LISTENING = /http:\/\/localhost:(\d+)/;

let directory: string;
let running: ChildProcess | undefined;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "reservas-"));
});

afterEach(async () => {
  if (running) await stop(running, "SIGKILL");
  rmSync(directory, { recursive: true, force: true });
});

function start() {
  const child = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
    env: { ...process.env, PORT: "0", DATABASE_PATH: join(directory, "reservas.db") },
    stdio: ["ignore", "pipe", "inherit"],
  });
  running = child;

  return new Promise<{ child: ChildProcess; url: string }>((resolve, reject) => {
    child.once("exit", (code) => reject(new Error(`La API terminó antes de arrancar: ${code}`)));
    child.stdout?.on("data", (chunk: Buffer) => {
      const match = LISTENING.exec(chunk.toString());
      if (match) resolve({ child, url: `http://localhost:${match[1]}/api` });
    });
  });
}

function stop(child: ChildProcess, signal: NodeJS.Signals) {
  return new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.removeAllListeners("exit");
    child.once("exit", () => resolve());
    child.kill(signal);
  });
}

async function reserve(url: string, start: string, end: string) {
  const response = await fetch(`${url}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unitId: "MIC-01", requester: "Ada Pruebas", start, end }),
  });

  return response.json();
}

async function listReservations(url: string) {
  const response = await fetch(`${url}/reservations`);
  const body = await response.json();

  return body.reservations;
}

function runReset(...args: string[]) {
  const child = spawn(process.execPath, ["--import", "tsx", "src/db/reset.ts", ...args], {
    env: { ...process.env, DATABASE_PATH: join(directory, "reservas.db") },
    stdio: "ignore",
  });

  return new Promise<number | null>((resolve) => child.once("exit", resolve));
}

describe("reinicio de datos", () => {
  it("sin confirmación no borra; con --yes borra reservas y conserva el inventario", async () => {
    const first = await start();
    await reserve(first.url, "2099-01-10T10:00", "2099-01-10T11:00");
    await stop(first.child, "SIGTERM");

    expect(await runReset()).toBe(1);

    const second = await start();
    expect(await listReservations(second.url)).toHaveLength(1);
    await stop(second.child, "SIGTERM");

    expect(await runReset("--yes")).toBe(0);

    const third = await start();
    expect(await listReservations(third.url)).toEqual([]);

    const units = await (await fetch(`${third.url}/units`)).json();
    expect(units.units).toHaveLength(5);

    const created = await reserve(third.url, "2099-01-10T10:00", "2099-01-10T11:00");
    expect(created.id).toBe("RES-0001");
  }, 30_000);
});

describe.each([
  ["detención ordenada", "SIGTERM"],
  ["corte abrupto", "SIGKILL"],
] as const)("reinicio tras %s", (_name, signal) => {
  it("recupera reservas activas y canceladas, y siguen aplicando las reglas", async () => {
    const first = await start();
    const active = await reserve(first.url, "2099-01-10T10:00", "2099-01-10T11:00");
    const toCancel = await reserve(first.url, "2099-01-10T12:00", "2099-01-10T13:00");
    const cancelResponse = await fetch(`${first.url}/reservations/${toCancel.id}/cancel`, { method: "POST" });
    const cancelled = await cancelResponse.json();
    const before = await listReservations(first.url);
    await stop(first.child, signal);

    const second = await start();

    expect(before).toEqual([active, cancelled]);
    expect(await listReservations(second.url)).toEqual(before);

    const blocked = await fetch(`${second.url}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId: "MIC-01",
        requester: "Ada Pruebas",
        start: "2099-01-10T10:30",
        end: "2099-01-10T11:30",
      }),
    });
    expect(blocked.status).toBe(409);

    const reused = await reserve(second.url, "2099-01-10T12:00", "2099-01-10T13:00");
    expect(reused.id).toBe("RES-0003");
  }, 30_000);
});
