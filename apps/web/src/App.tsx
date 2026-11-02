import { useCallback, useReducer, useState } from "react";
import styles from "./App.module.css";
import { DayBoard } from "./features/day-board/DayBoard";
import { BookingForm } from "./features/reservation-booking/BookingForm";
import { ReservationHistory } from "./features/reservation-history/ReservationHistory";
import type { Reservation } from "./shared/api/types";
import { currentDateTime, dateOf } from "./shared/time/local";

const EMPTY_SELECTION = { unitId: "MIC-01", start: "", end: "" };

export default function App() {
  const [date, setDate] = useState(() => dateOf(currentDateTime()));
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [selectionState, setSelectionState] = useState<"idle" | "available" | "conflict">("idle");
  const [version, refresh] = useReducer((value: number) => value + 1, 0);

  const handleCreated = useCallback((reservation: Reservation) => {
    setDate(dateOf(reservation.startsAt));
    setSelection((current) => ({ ...current, start: "", end: "" }));
    refresh();
  }, []);

  return (
    <main className={styles.page}>
      <p className={styles.product}>Reservas del laboratorio</p>
      <DayBoard
        date={date}
        version={version}
        selection={selection}
        selectionState={selectionState}
        onDateChange={setDate}
        onSelect={setSelection}
      />
      <div className={styles.panels}>
        <BookingForm
          selection={selection}
          onChange={setSelection}
          onStateChange={setSelectionState}
          onCreated={handleCreated}
        />
        <ReservationHistory date={date} version={version} onCancelled={refresh} />
      </div>
    </main>
  );
}
