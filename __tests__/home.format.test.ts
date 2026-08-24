import { formatReminderTime } from '../src/screens/home.format';

const NOW = new Date('2026-05-04T09:00:00');

test('returns "Overdue" for past times', () => {
  expect(formatReminderTime('2026-05-03T08:00:00', NOW)).toBe('Overdue');
});

test('formats today as "Today • HH:MM AM/PM"', () => {
  expect(formatReminderTime('2026-05-04T14:30:00', NOW)).toBe('Today • 02:30 PM');
});

test('formats tomorrow as "Tomorrow • ..."', () => {
  expect(formatReminderTime('2026-05-05T10:00:00', NOW)).toBe('Tomorrow • 10:00 AM');
});

test('formats day-of-week within next 7 days', () => {
  // 2026-05-09 is a Saturday.
  expect(formatReminderTime('2026-05-09T14:30:00', NOW)).toBe('Saturday • 02:30 PM');
});

test('formats further-out dates as "Mon DD • ..."', () => {
  expect(formatReminderTime('2026-06-15T09:00:00', NOW)).toBe('Jun 15 • 09:00 AM');
});

test('handles midnight correctly', () => {
  // 2026-05-05 00:00 from a 2026-05-04 09:00 baseline → "Tomorrow • 12:00 AM"
  expect(formatReminderTime('2026-05-05T00:00:00', NOW)).toBe('Tomorrow • 12:00 AM');
});

test('returns empty string for invalid input', () => {
  expect(formatReminderTime('not-a-date', NOW)).toBe('');
});
