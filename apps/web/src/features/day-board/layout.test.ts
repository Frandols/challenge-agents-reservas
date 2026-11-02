import { describe, expect, it } from "vitest";
import { barPosition, intervalFromDrag, snapToGrid } from "./layout";

const DAY = "2026-11-10";

describe("barPosition", () => {
  it("ubica una reserva dentro del día", () => {
    expect(barPosition(`${DAY}T06:00`, `${DAY}T12:00`, DAY)).toEqual({ left: "25%", width: "25%" });
  });

  it("recorta una reserva que empieza el día anterior", () => {
    expect(barPosition("2026-11-09T22:00", `${DAY}T06:00`, DAY)).toEqual({ left: "0%", width: "25%" });
  });

  it("recorta una reserva que termina el día siguiente", () => {
    expect(barPosition(`${DAY}T18:00`, "2026-11-11T02:00", DAY)).toEqual({ left: "75%", width: "25%" });
  });

  it("no dibuja una reserva de otro día", () => {
    expect(barPosition("2026-11-11T10:00", "2026-11-11T11:00", DAY)).toBeNull();
  });
});

describe("snapToGrid", () => {
  it("ajusta a cuartos de hora", () => {
    expect(snapToGrid(100.4, 1440)).toBe(105);
  });

  it("no sale del día", () => {
    expect(snapToGrid(-50, 1440)).toBe(0);
    expect(snapToGrid(2000, 1440)).toBe(1440);
  });
});

describe("intervalFromDrag", () => {
  it("funciona arrastrando en cualquier dirección", () => {
    const expected = { start: `${DAY}T10:00`, end: `${DAY}T11:30` };

    expect(intervalFromDrag(DAY, 600, 690)).toEqual(expected);
    expect(intervalFromDrag(DAY, 690, 600)).toEqual(expected);
  });

  it("un clic propone una hora", () => {
    expect(intervalFromDrag(DAY, 600, 600)).toEqual({ start: `${DAY}T10:00`, end: `${DAY}T11:00` });
  });

  it("un clic al final del día queda dentro del día", () => {
    expect(intervalFromDrag(DAY, 1440, 1440)).toEqual({ start: `${DAY}T23:00`, end: "2026-11-11T00:00" });
  });

  it("el fin del día pasa a la medianoche siguiente", () => {
    expect(intervalFromDrag(DAY, 1380, 1440).end).toBe("2026-11-11T00:00");
  });
});
