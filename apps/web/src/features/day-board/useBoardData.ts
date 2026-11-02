import { useEffect, useState } from "react";
import { ApiError, apiGet } from "../../shared/api/client";
import type { Reservation, Unit } from "../../shared/api/types";

type BoardData = { units: Unit[]; reservations: Reservation[] };

export function useBoardData(date: string, version: number) {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      apiGet<{ units: Unit[] }>("/units"),
      apiGet<{ reservations: Reservation[] }>("/reservations", { date }),
    ])
      .then(([{ units }, { reservations }]) => {
        if (ignore) return;
        setData({ units, reservations });
        setError(null);
      })
      .catch((reason: ApiError) => {
        if (!ignore) setError(reason.message);
      });

    return () => {
      ignore = true;
    };
  }, [date, version]);

  return { data, error };
}
