export const TIME_ZONE = "America/Argentina/Buenos_Aires";

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type Now = () => string;

export function isLocalDate(value: string) {
  const match = LOCAL_DATE.exec(value);
  if (!match) return false;

  return isRealDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function isLocalDateTime(value: string) {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return false;

  const hour = Number(match[4]);
  const minute = Number(match[5]);

  return (
    isRealDate(Number(match[1]), Number(match[2]), Number(match[3])) &&
    hour <= 23 &&
    minute <= 59
  );
}

function isRealDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function nextDay(date: string) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);

  return next.toISOString().slice(0, 10);
}

export function systemNow(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
