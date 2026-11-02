import { addDays, dateOf, timeOf } from "../../shared/time/local";

export const MINUTES_PER_DAY = 24 * 60;
const SNAP_MINUTES = 15;
const CLICK_MINUTES = 60;

function minutesInDay(dateTime: string, date: string) {
  if (dateOf(dateTime) < date) return 0;
  if (dateOf(dateTime) > date) return MINUTES_PER_DAY;

  const [hours = 0, minutes = 0] = timeOf(dateTime).split(":").map(Number);

  return hours * 60 + minutes;
}

export function barPosition(start: string, end: string, date: string) {
  const from = minutesInDay(start, date);
  const to = minutesInDay(end, date);

  if (to <= from) return null;

  return {
    left: `${(from / MINUTES_PER_DAY) * 100}%`,
    width: `${((to - from) / MINUTES_PER_DAY) * 100}%`,
  };
}

export function snapToGrid(offsetX: number, trackWidth: number) {
  const minutes = (offsetX / trackWidth) * MINUTES_PER_DAY;
  const snapped = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

  return Math.min(Math.max(snapped, 0), MINUTES_PER_DAY);
}

function toDateTime(date: string, minutes: number) {
  if (minutes >= MINUTES_PER_DAY) return `${addDays(date, 1)}T00:00`;

  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const rest = String(minutes % 60).padStart(2, "0");

  return `${date}T${hours}:${rest}`;
}

export function intervalFromDrag(date: string, anchor: number, current: number) {
  const from = Math.min(anchor, current);
  const to = Math.max(anchor, current);

  if (from === to) {
    const start = Math.min(from, MINUTES_PER_DAY - CLICK_MINUTES);

    return { start: toDateTime(date, start), end: toDateTime(date, start + CLICK_MINUTES) };
  }

  return { start: toDateTime(date, from), end: toDateTime(date, to) };
}
