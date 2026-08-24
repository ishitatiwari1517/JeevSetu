export type ReminderKind = 'vaccination' | 'appointment' | 'grooming';

export interface Reminder {
  id: string;
  petId: string;
  kind: ReminderKind;
  title: string;
  // ISO datetime — local TZ display is the caller's job.
  dueAt: string;
}

/**
 * Aggregates upcoming reminders across vaccinations, appointments, and
 * grooming schedules. Today this returns [] because the source feeds
 * (#14 vaccinations, #12 appointments) don't exist yet — when they
 * land, this becomes a real merge over those services.
 *
 * Until then the Home dashboard renders its empty state cleanly.
 */
export const listUpcomingReminders = async (): Promise<Reminder[]> => {
  // TODO #14: pull next-due vaccinations from vaccinationService.
  // TODO #12: pull upcoming appointments from appointmentService.
  // Sort by dueAt asc, slice top N for the dashboard preview.
  return [];
};
