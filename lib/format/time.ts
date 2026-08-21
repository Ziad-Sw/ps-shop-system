const DISPLAY_TIME_LOCALE = "en-US";
const DISPLAY_DATE_LOCALE = "ar-EG-u-nu-latn";
const DISPLAY_TIME_ZONE = "Africa/Cairo";

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat(DISPLAY_TIME_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(toDate(iso));
}

export function formatDateTime(iso: string | Date): string {
  const date = toDate(iso);
  const formattedDate = new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);

  return `${formattedDate}، ${formatTime(date)}`;
}

export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(toDate(iso));
}
