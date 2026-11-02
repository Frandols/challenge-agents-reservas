import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app";
import { openDatabase } from "./db/client";

const DAY = "2026-11-10";
const at = (time: string) => `${DAY}T${time}`;

let app: Express;
let close: () => void;
let currentTime: string;

beforeEach(() => {
  const database = openDatabase(":memory:");
  close = database.close;
  currentTime = "2026-11-02T09:00";
  app = createApp({ db: database.db, now: () => currentTime });
});

afterEach(() => close());

function reserve(unitId: string, start: string, end: string, requester = "Ada Pruebas") {
  return request(app).post("/api/reservations").send({ unitId, requester, start: at(start), end: at(end) });
}

function availability(unitId: string, start: string, end: string) {
  return request(app).get("/api/availability").query({ unitId, start: at(start), end: at(end) });
}

describe("límites consecutivos", () => {
  it("permite empezar exactamente cuando termina otra reserva", async () => {
    await reserve("MIC-01", "10:00", "11:00");

    const response = await reserve("MIC-01", "11:00", "12:00");

    expect(response.status).toBe(201);
  });

  it("permite terminar exactamente cuando empieza otra reserva", async () => {
    await reserve("MIC-01", "10:00", "11:00");

    const response = await reserve("MIC-01", "09:00", "10:00");

    expect(response.status).toBe(201);
  });
});

describe("creación", () => {
  it("crea una reserva identificable y activa", async () => {
    const response = await reserve("MIC-01", "10:00", "11:00");

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "RES-0001",
      unitId: "MIC-01",
      requester: "Ada Pruebas",
      startsAt: at("10:00"),
      endsAt: at("11:00"),
      status: "active",
      cancelledAt: null,
    });
  });

  it("guarda el solicitante sin espacios de los extremos", async () => {
    const response = await reserve("MIC-01", "10:00", "11:00", "  Ada Pruebas  ");

    expect(response.body.requester).toBe("Ada Pruebas");
  });
});

describe("superposición", () => {
  it.each([
    ["solapa el final", "10:30", "11:30"],
    ["solapa el inicio", "09:30", "10:30"],
    ["queda contenida", "10:15", "10:45"],
    ["contiene a la existente", "09:00", "12:00"],
    ["es idéntica", "10:00", "11:00"],
  ])("rechaza una reserva que %s", async (_name, start, end) => {
    const first = await reserve("MIC-01", "10:00", "11:00");

    const response = await reserve("MIC-01", start, end);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("reservation_conflict");
    expect(response.body.error.details[0].id).toBe(first.body.id);

    const list = await request(app).get("/api/reservations");
    expect(list.body.reservations).toHaveLength(1);
  });

  it("permite la misma franja en unidades distintas", async () => {
    await reserve("MIC-01", "10:00", "11:00");

    const response = await reserve("MIC-02", "10:00", "11:00");

    expect(response.status).toBe(201);
  });
});

describe("entradas inválidas", () => {
  it("rechaza una unidad fuera del inventario", async () => {
    const response = await reserve("MIC-99", "10:00", "11:00");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("unit_not_found");
  });

  it.each([
    ["vacío", ""],
    ["de solo espacios", "   "],
  ])("rechaza un solicitante %s", async (_name, requester) => {
    const response = await reserve("MIC-01", "10:00", "11:00", requester);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("invalid_input");
  });

  it.each([
    ["fecha imposible", "2026-02-30T10:00", "2026-03-01T10:00"],
    ["hora imposible", "2026-11-10T25:00", "2026-11-10T26:00"],
    ["formato incorrecto", "10/11/2026 10:00", "10/11/2026 11:00"],
  ])("rechaza una %s", async (_name, start, end) => {
    const response = await request(app)
      .post("/api/reservations")
      .send({ unitId: "MIC-01", requester: "Ada Pruebas", start, end });

    expect(response.status).toBe(400);
  });

  it.each([
    ["igual al fin", "10:00", "10:00"],
    ["posterior al fin", "11:00", "10:00"],
  ])("rechaza un inicio %s", async (_name, start, end) => {
    const response = await reserve("MIC-01", start, end);

    expect(response.status).toBe(400);
  });

  it("rechaza un inicio en el pasado", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .send({ unitId: "MIC-01", requester: "Ada Pruebas", start: "2026-11-01T10:00", end: "2026-11-01T11:00" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("start_in_past");
  });

  it("rechaza campos faltantes", async () => {
    const response = await request(app).post("/api/reservations").send({});

    expect(response.status).toBe(400);
  });

  it("rechaza un cuerpo que no es JSON", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set("Content-Type", "application/json")
      .send("{no es json");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("invalid_json");
  });
});

describe("cancelación", () => {
  it("conserva el registro y sus datos", async () => {
    const { body: created } = await reserve("MIC-01", "10:00", "11:00");

    const response = await request(app).post(`/api/reservations/${created.id}/cancel`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...created, status: "cancelled", cancelledAt: "2026-11-02T09:00" });

    const list = await request(app).get("/api/reservations");
    expect(list.body.reservations).toEqual([response.body]);
  });

  it("libera el horario", async () => {
    const { body: created } = await reserve("MIC-01", "10:00", "11:00");
    await request(app).post(`/api/reservations/${created.id}/cancel`);

    const response = await reserve("MIC-01", "10:00", "11:00");

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("RES-0002");
  });

  it("rechaza cancelar dos veces y conserva la fecha original", async () => {
    const { body: created } = await reserve("MIC-01", "10:00", "11:00");
    await request(app).post(`/api/reservations/${created.id}/cancel`);
    currentTime = "2026-11-03T09:00";

    const response = await request(app).post(`/api/reservations/${created.id}/cancel`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("already_cancelled");

    const list = await request(app).get("/api/reservations");
    expect(list.body.reservations[0].cancelledAt).toBe("2026-11-02T09:00");
  });

  it.each(["RES-9999", "cualquiera"])("responde 404 para %s", async (id) => {
    const response = await request(app).post(`/api/reservations/${id}/cancel`);

    expect(response.status).toBe(404);
  });
});

describe("disponibilidad coherente con la creación", () => {
  it.each([
    ["superposición", "MIC-01", "10:30", "11:30", false],
    ["consecutivo", "MIC-01", "11:00", "12:00", true],
    ["otra unidad", "MIC-02", "10:00", "11:00", true],
  ])("coincide para %s", async (_name, unitId, start, end, expected) => {
    await reserve("MIC-01", "10:00", "11:00");

    const query = await availability(unitId, start, end);
    const creation = await reserve(unitId, start, end);

    expect(query.status).toBe(200);
    expect(query.body.available).toBe(expected);
    expect(creation.status).toBe(expected ? 201 : 409);
  });

  it("coincide después de cancelar", async () => {
    const { body: created } = await reserve("MIC-01", "10:00", "11:00");
    await request(app).post(`/api/reservations/${created.id}/cancel`);

    const query = await availability("MIC-01", "10:00", "11:00");
    const creation = await reserve("MIC-01", "10:00", "11:00");

    expect(query.body).toMatchObject({ available: true, conflicts: [] });
    expect(creation.status).toBe(201);
  });

  it("informa los conflictos", async () => {
    const { body: created } = await reserve("MIC-01", "10:00", "11:00");

    const response = await availability("MIC-01", "10:30", "11:30");

    expect(response.body.conflicts).toEqual([created]);
  });

  it("aplica las mismas validaciones", async () => {
    expect((await availability("MIC-99", "10:00", "11:00")).status).toBe(404);
    expect((await availability("MIC-01", "11:00", "10:00")).status).toBe(400);
  });

  it("permite consultar el pasado", async () => {
    const response = await request(app)
      .get("/api/availability")
      .query({ unitId: "MIC-01", start: "2026-11-01T10:00", end: "2026-11-01T11:00" });

    expect(response.status).toBe(200);
  });
});

describe("listados", () => {
  it("devuelve el inventario completo", async () => {
    const response = await request(app).get("/api/units");

    expect(response.body.units.map((unit: { id: string }) => unit.id)).toEqual([
      "FUE-01",
      "MIC-01",
      "MIC-02",
      "MUL-01",
      "OSC-01",
    ]);
  });

  it("filtra por día incluyendo reservas que lo atraviesan", async () => {
    await reserve("MIC-01", "10:00", "11:00");
    await request(app)
      .post("/api/reservations")
      .send({ unitId: "MIC-02", requester: "Ada Pruebas", start: "2026-11-09T23:00", end: "2026-11-10T01:00" });
    await request(app)
      .post("/api/reservations")
      .send({ unitId: "MIC-02", requester: "Ada Pruebas", start: "2026-11-11T00:00", end: "2026-11-11T01:00" });

    const response = await request(app).get("/api/reservations").query({ date: DAY });

    expect(response.body.reservations).toHaveLength(2);
  });

  it("filtra por estado", async () => {
    const { body: created } = await reserve("MIC-01", "10:00", "11:00");
    await request(app).post(`/api/reservations/${created.id}/cancel`);
    await reserve("MIC-01", "10:00", "11:00");

    const response = await request(app).get("/api/reservations").query({ status: "cancelled" });

    expect(response.body.reservations.map((r: { id: string }) => r.id)).toEqual([created.id]);
  });
});
