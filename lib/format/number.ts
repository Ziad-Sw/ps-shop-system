const DISPLAY_NUMBER_LOCALE = "en-US";

export function formatCount(value: number): string {
  return new Intl.NumberFormat(DISPLAY_NUMBER_LOCALE, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat(DISPLAY_NUMBER_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ج.م`;
}
