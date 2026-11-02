import { type FormEvent, useEffect, useState } from "react";
import { ApiError, apiGet, apiPost } from "../../shared/api/client";
import type { Availability, FieldIssue, Reservation, Unit } from "../../shared/api/types";
import { dateOf, formatDay, formatRange } from "../../shared/time/local";
import styles from "./BookingForm.module.css";

type Selection = { unitId: string; start: string; end: string };
type SelectionState = "idle" | "available" | "conflict";

type Props = {
  selection: Selection;
  onChange: (selection: Selection) => void;
  onStateChange: (state: SelectionState) => void;
  onCreated: (reservation: Reservation) => void;
};

export function BookingForm({ selection, onChange, onStateChange, onCreated }: Props) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [requester, setRequester] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<{ units: Unit[] }>("/units")
      .then(({ units }) => setUnits(units))
      .catch((reason: ApiError) => setFormError(reason.message));
  }, []);

  const { unitId, start, end } = selection;
  const intervalIsComplete = Boolean(unitId && start && end && start < end);

  useEffect(() => {
    setAvailability(null);
    onStateChange("idle");

    if (!intervalIsComplete) return;

    setConfirmation(null);
    setFormError(null);

    let ignore = false;
    const timer = setTimeout(() => {
      apiGet<Availability>("/availability", { unitId, start, end })
        .then((result) => {
          if (ignore) return;
          setAvailability(result);
          onStateChange(result.available ? "available" : "conflict");
        })
        .catch(() => {
          // El envío del formulario informa el error con su detalle.
        });
    }, 200);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [unitId, start, end, intervalIsComplete, onStateChange]);

  function update(changes: Partial<Selection>) {
    onChange({ ...selection, ...changes });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setConfirmation(null);

    try {
      const reservation = await apiPost<Reservation>("/reservations", { unitId, requester, start, end });

      setRequester("");
      setConfirmation(
        `Reservaste ${reservation.unitId} el ${formatDay(dateOf(reservation.startsAt))}, ${formatRange(reservation.startsAt, reservation.endsAt)}. Número ${reservation.id}.`,
      );
      onCreated(reservation);
    } catch (reason) {
      const error = reason as ApiError;

      if (error.code === "invalid_input") {
        const issues = error.details as FieldIssue[];
        setFieldErrors(Object.fromEntries(issues.map(({ field, message }) => [field, message])));
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const conflicts = availability?.conflicts ?? [];

  return (
    <section aria-labelledby="booking-title" className={styles.panel}>
      <h2 id="booking-title" className={styles.title}>
        Nueva reserva
      </h2>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <label className={styles.field}>
          Unidad
          <select value={unitId} onChange={(event) => update({ unitId: event.target.value })}>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.id}, {unit.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Solicitante
          <input
            value={requester}
            onChange={(event) => {
              setRequester(event.target.value);
              setConfirmation(null);
            }}
            aria-invalid={Boolean(fieldErrors.requester)}
            aria-describedby={fieldErrors.requester ? "requester-error" : undefined}
          />
          {fieldErrors.requester && (
            <span id="requester-error" className={styles.fieldError}>
              {fieldErrors.requester}
            </span>
          )}
        </label>

        <div className={styles.times}>
          <label className={styles.field}>
            Inicio
            <input
              type="datetime-local"
              value={start}
              onChange={(event) => update({ start: event.target.value })}
              aria-invalid={Boolean(fieldErrors.start)}
              aria-describedby={fieldErrors.start ? "start-error" : undefined}
            />
            {fieldErrors.start && (
              <span id="start-error" className={styles.fieldError}>
                {fieldErrors.start}
              </span>
            )}
          </label>

          <label className={styles.field}>
            Fin
            <input
              type="datetime-local"
              value={end}
              onChange={(event) => update({ end: event.target.value })}
              aria-invalid={Boolean(fieldErrors.end)}
              aria-describedby={fieldErrors.end ? "end-error" : undefined}
            />
            {fieldErrors.end && (
              <span id="end-error" className={styles.fieldError}>
                {fieldErrors.end}
              </span>
            )}
          </label>
        </div>

        <div aria-live="polite" className={styles.status}>
          {availability?.available && !formError && (
            <p className={styles.free}>
              {unitId} está libre, {formatRange(start, end)}.
            </p>
          )}
          {conflicts.length > 0 && (
            <p className={styles.taken}>
              {unitId} está ocupada:{" "}
              {conflicts.map((c) => `${formatRange(c.startsAt, c.endsAt)} (${c.requester})`).join("; ")}. Elegí otro
              horario u otra unidad.
            </p>
          )}
          {formError && (
            <p role="alert" className={styles.taken}>
              {formError}
            </p>
          )}
          {confirmation && <p className={styles.free}>{confirmation}</p>}
        </div>

        <button type="submit" className={styles.submit} disabled={submitting || conflicts.length > 0}>
          Reservar {unitId}
        </button>
      </form>
    </section>
  );
}
