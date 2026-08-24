const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const startOfDay = (d: Date): number => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

const formatClock = (d: Date): string => {
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

/**
 * Format a reminder's due time relative to now.
 *  - same calendar day → "Today • HH:MM AM/PM"
 *  - tomorrow          → "Tomorrow • HH:MM AM/PM"
 *  - within 7 days     → "Saturday • HH:MM AM/PM"
 *  - else              → "Mar 15 • HH:MM AM/PM"
 *  - past times        → "Overdue"
 *
 * `now` is injectable for testability.
 */
export const formatReminderTime = (
  isoDateTime: string,
  now: Date = new Date(),
): string => {
  const due = new Date(isoDateTime);
  if (Number.isNaN(due.getTime())) return '';
  if (due.getTime() < now.getTime()) return 'Overdue';

  const diffDays = Math.round((startOfDay(due) - startOfDay(now)) / DAY_MS);
  const clock = formatClock(due);

  if (diffDays === 0) return `Today • ${clock}`;
  if (diffDays === 1) return `Tomorrow • ${clock}`;
  if (diffDays >= 2 && diffDays <= 6) return `${DAYS_OF_WEEK[due.getDay()]} • ${clock}`;
  return `${MONTHS[due.getMonth()]} ${due.getDate()} • ${clock}`;
};
