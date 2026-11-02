import { type PointerEvent, useEffect, useRef, useState } from "react";
import type { Reservation, Unit } from "../../shared/api/types";
import { addDays, currentDateTime, dateOf, formatDay, formatRange } from "../../shared/time/local";
import styles from "./DayBoard.module.css";
import { barPosition, intervalFromDrag, snapToGrid } from "./layout";
import { useBoardData } from "./useBoardData";
import { useIsNarrow } from "./useIsNarrow";

type Selection = { unitId: string; start: string; end: string };

type Props = {
  date: string;
  version: number;
  selection: Selection;
  selectionState: "idle" | "available" | "conflict";
  onDateChange: (date: string) => void;
  onSelect: (selection: Selection) => void;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const HOUR_WIDTH = 88;
const FIRST_VISIBLE_HOUR = 7;

export function DayBoard({ date, version, selection, selectionState, onDateChange, onSelect }: Props) {
  const { data, error } = useBoardData(date, version);
  const isNarrow = useIsNarrow();
  const scroller = useRef<HTMLDivElement>(null);
  const today = dateOf(currentDateTime());

  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = FIRST_VISIBLE_HOUR * HOUR_WIDTH;
  }, [data !== null, isNarrow]);

  return (
    <section aria-labelledby="board-title">
      <header className={styles.header}>
        <h1 id="board-title" className={styles.day}>
          {formatDay(date)}
        </h1>
        <div className={styles.nav}>
          <button type="button" onClick={() => onDateChange(addDays(date, -1))}>
            Día anterior
          </button>
          <button type="button" onClick={() => onDateChange(today)} disabled={date === today}>
            Hoy
          </button>
          <button type="button" onClick={() => onDateChange(addDays(date, 1))}>
            Día siguiente
          </button>
          <label className={styles.datePicker}>
            <span className={styles.hidden}>Ir a una fecha</span>
            <input
              type="date"
              value={date}
              required
              onChange={(event) => event.target.value && onDateChange(event.target.value)}
            />
          </label>
        </div>
      </header>

      {error && <p role="alert" className={styles.error}>{error}</p>}

      {data && !isNarrow && (
        <>
          <p className={styles.hint}>
            Arrastrá sobre una fila para elegir unidad y horario. Las barras rayadas son reservas canceladas: no
            ocupan el horario.
          </p>
          <div className={styles.scroller} ref={scroller} tabIndex={0} aria-label="Tablero del día por unidad">
            <div className={styles.board} style={{ width: 136 + HOUR_WIDTH * 24 }}>
              <div className={styles.corner} />
              <div className={styles.hours}>
                {HOURS.map((hour) => (
                  <span key={hour}>{String(hour).padStart(2, "0")}</span>
                ))}
              </div>
              {data.units.map((unit) => (
                <UnitRow
                  key={unit.id}
                  unit={unit}
                  date={date}
                  now={date === today ? currentDateTime() : null}
                  reservations={data.reservations.filter((r) => r.unitId === unit.id)}
                  selection={selection.unitId === unit.id ? selection : null}
                  selectionState={selectionState}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {data && isNarrow && <NarrowList date={date} units={data.units} reservations={data.reservations} />}
    </section>
  );
}

type RowProps = {
  unit: Unit;
  date: string;
  now: string | null;
  reservations: Reservation[];
  selection: Selection | null;
  selectionState: Props["selectionState"];
  onSelect: Props["onSelect"];
};

function UnitRow({ unit, date, now, reservations, selection, selectionState, onSelect }: RowProps) {
  const [drag, setDrag] = useState<{ anchor: number; current: number } | null>(null);

  function positionOf(event: PointerEvent<HTMLDivElement>) {
    const track = event.currentTarget.getBoundingClientRect();

    return snapToGrid(event.clientX - track.left, track.width);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const anchor = positionOf(event);
    setDrag({ anchor, current: anchor });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (drag) setDrag({ ...drag, current: positionOf(event) });
  }

  function handlePointerUp() {
    if (!drag) return;

    onSelect({ unitId: unit.id, ...intervalFromDrag(date, drag.anchor, drag.current) });
    setDrag(null);
  }

  const preview = drag ? intervalFromDrag(date, drag.anchor, drag.current) : selection;
  const previewPosition =
    preview?.start && preview.end && preview.start < preview.end
      ? barPosition(preview.start, preview.end, date)
      : null;
  const conflict = !drag && selectionState === "conflict";

  return (
    <>
      <div className={styles.plate}>
        <span className={styles.unitId}>{unit.id}</span>
        <span className={styles.unitName}>{unit.name}</span>
      </div>
      <div
        className={styles.track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {reservations.map((reservation) => (
          <ReservationBar key={reservation.id} reservation={reservation} date={date} />
        ))}
        {previewPosition && (
          <span
            className={`${styles.preview} ${conflict ? styles.previewConflict : ""}`}
            style={previewPosition}
          />
        )}
        {now && <span className={styles.now} style={{ left: barPosition(`${date}T00:00`, now, date)?.width }} />}
      </div>
    </>
  );
}

function ReservationBar({ reservation, date }: { reservation: Reservation; date: string }) {
  const position = barPosition(reservation.startsAt, reservation.endsAt, date);
  const range = formatRange(reservation.startsAt, reservation.endsAt);

  if (!position) return null;

  if (reservation.status === "cancelled") {
    return (
      <span
        className={styles.cancelled}
        style={position}
        title={`Cancelada: ${reservation.requester}, ${range}`}
      />
    );
  }

  return (
    <span className={styles.active} style={position} title={`${reservation.requester}, ${range}`}>
      {reservation.requester}
    </span>
  );
}

function NarrowList({ date, units, reservations }: { date: string; units: Unit[]; reservations: Reservation[] }) {
  return (
    <ul className={styles.list}>
      {units.map((unit) => {
        const own = reservations.filter((r) => r.unitId === unit.id && r.status === "active");

        return (
          <li key={unit.id} className={styles.listItem}>
            <span className={styles.unitId}>{unit.id}</span>
            <span className={styles.unitName}>{unit.name}</span>
            {own.length === 0 ? (
              <p>Libre todo el {formatDay(date)}.</p>
            ) : (
              own.map((r) => (
                <p key={r.id}>
                  {formatRange(r.startsAt, r.endsAt)}: {r.requester}
                </p>
              ))
            )}
          </li>
        );
      })}
    </ul>
  );
}
