import { useEffect, useState } from "react";
import { ApiError, apiGet, apiPost } from "../../shared/api/client";
import type { Reservation } from "../../shared/api/types";
import { dateOf, formatDay, formatRange } from "../../shared/time/local";
import styles from "./ReservationHistory.module.css";

type Scope = "day" | "all";
type StatusFilter = "any" | "active" | "cancelled";

type Props = {
  date: string;
  version: number;
  onCancelled: () => void;
};

const STATUS_LABEL: Record<StatusFilter, string> = {
  any: "Todas",
  active: "Activas",
  cancelled: "Canceladas",
};

export function ReservationHistory({ date, version, onCancelled }: Props) {
  const [scope, setScope] = useState<Scope>("day");
  const [status, setStatus] = useState<StatusFilter>("any");
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const query: Record<string, string> = {};

    if (scope === "day") query.date = date;
    if (status !== "any") query.status = status;

    apiGet<{ reservations: Reservation[] }>("/reservations", query)
      .then((result) => {
        if (ignore) return;
        setReservations(result.reservations);
        setError(null);
      })
      .catch((reason: ApiError) => {
        if (!ignore) setError(reason.message);
      });

    return () => {
      ignore = true;
    };
  }, [date, scope, status, version]);

  async function cancel(id: string) {
    try {
      await apiPost(`/reservations/${id}/cancel`);
      setConfirming(null);
      setError(null);
      onCancelled();
    } catch (reason) {
      setError((reason as ApiError).message);
    }
  }

  return (
    <section aria-labelledby="history-title" className={styles.panel}>
      <div className={styles.header}>
        <h2 id="history-title" className={styles.title}>
          Historial
        </h2>
        <div className={styles.filters}>
          <label>
            <span className={styles.hidden}>Período</span>
            <select value={scope} onChange={(event) => setScope(event.target.value as Scope)}>
              <option value="day">Este día</option>
              <option value="all">Todas las fechas</option>
            </select>
          </label>
          <label>
            <span className={styles.hidden}>Estado</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {reservations?.length === 0 && (
        <p className={styles.empty}>
          {status === "cancelled"
            ? "No hay reservas canceladas con este filtro."
            : "No hay reservas con este filtro. Arrastrá sobre una fila del tablero para crear una."}
        </p>
      )}

      {reservations && reservations.length > 0 && (
        <ul className={styles.list}>
          {reservations.map((reservation) => {
            const isCancelled = reservation.status === "cancelled";

            return (
              <li key={reservation.id} className={styles.item}>
                <span className={isCancelled ? styles.swatchCancelled : styles.swatchActive} aria-hidden="true" />
                <div className={styles.details}>
                  <p className={styles.main}>
                    <strong>{reservation.unitId}</strong> {reservation.requester}
                  </p>
                  <p className={styles.meta}>
                    {formatDay(dateOf(reservation.startsAt))},{" "}
                    {formatRange(reservation.startsAt, reservation.endsAt)}
                  </p>
                  <p className={styles.meta}>
                    {reservation.id}, {isCancelled ? "cancelada" : "activa"}
                  </p>
                </div>
                {!isCancelled && confirming !== reservation.id && (
                  <button type="button" className={styles.action} onClick={() => setConfirming(reservation.id)}>
                    Cancelar
                  </button>
                )}
                {!isCancelled && confirming === reservation.id && (
                  <div className={styles.confirm}>
                    <button type="button" className={styles.danger} onClick={() => cancel(reservation.id)}>
                      Cancelar {reservation.id}
                    </button>
                    <button type="button" className={styles.action} onClick={() => setConfirming(null)}>
                      Mantener
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
