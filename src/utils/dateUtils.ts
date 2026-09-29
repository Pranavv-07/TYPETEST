/**
 * IST (Indian Standard Time, UTC+5:30) Date and Time Utilities
 * Enforces IST formatting across all certificates, exam windows, reports, and audit logs.
 */

const IST_TIMEZONE = 'Asia/Kolkata';
const EN_IN_LOCALE = 'en-IN';

/**
 * Format a Date or ISO string into full IST Date & Time
 * e.g. "29 Sep 2026, 03:30 PM IST"
 */
export function formatISTDateTime(
  dateInput: Date | string | number | null | undefined,
  includeSeconds = false
): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    const formatted = new Intl.DateTimeFormat(EN_IN_LOCALE, {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    }).format(date);

    return `${formatted} IST`;
  } catch (err) {
    console.error('Error formatting IST datetime:', err);
    return String(dateInput);
  }
}

/**
 * Format date part only in IST
 * e.g. "29 Sep 2026"
 */
export function formatISTDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(EN_IN_LOCALE, {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

export const formatISTDateOnly = formatISTDate;


/**
 * Format time part only in IST
 * e.g. "03:30 PM IST"
 */
export function formatISTTime(
  dateInput: Date | string | number | null | undefined,
  includeSeconds = false
): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    const timeStr = new Intl.DateTimeFormat(EN_IN_LOCALE, {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    }).format(date);

    return `${timeStr} IST`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Returns current timestamp formatted in IST
 */
export function getCurrentISTString(): string {
  return formatISTDateTime(new Date());
}

/**
 * Get YYYY-MM-DD in IST timezone
 */
export function getISTDateKey(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  return `${year}-${month}-${day}`;
}

/**
 * Check if current IST time is between start and end windows
 */
export function isWithinISTWindow(
  startISO?: string | null,
  endISO?: string | null,
  referenceDate = new Date()
): { isOpen: boolean; status: 'upcoming' | 'active' | 'expired' | 'open' } {
  if (!startISO && !endISO) {
    return { isOpen: true, status: 'open' };
  }

  const now = referenceDate.getTime();
  const start = startISO ? new Date(startISO).getTime() : 0;
  const end = endISO ? new Date(endISO).getTime() : Infinity;

  if (now < start) {
    return { isOpen: false, status: 'upcoming' };
  }
  if (now > end) {
    return { isOpen: false, status: 'expired' };
  }
  return { isOpen: true, status: 'active' };
}
