export const TIME_ZONE = "America/Argentina/Buenos_Aires";

export function currentDateTime() {
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

export const dateOf = (dateTime: string) => dateTime.slice(0, 10);
export const timeOf = (dateTime: string) => dateTime.slice(11, 16);

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

export function formatDay(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatRange(start: string, end: string) {
  if (dateOf(start) === dateOf(end)) return `${timeOf(start)} a ${timeOf(end)}`;

  return `${timeOf(start)} del ${formatDay(dateOf(start))} a ${timeOf(end)} del ${formatDay(dateOf(end))}`;
}
