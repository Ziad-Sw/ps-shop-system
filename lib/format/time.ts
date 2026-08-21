const DISPLAY_LOCALE = "en-US";
const DISPLAY_TIME_ZONE = "Africa/Cairo";

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(toDate(iso));
}

export function formatDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(toDate(iso));
}

export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(toDate(iso));
}