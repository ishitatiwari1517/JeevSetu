// ─── Animal Event Service ─────────────────────────────────────────────────────
// Builds and retrieves the immutable timeline of events for each animal.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimalEvent, CreateAnimalEventInput } from '../models/AnimalEvent';

const KEY = (orgId: string) => `@petvue_events_${orgId}`;

const generateId = () => 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2);

const readAll = async (orgId: string): Promise<AnimalEvent[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY(orgId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const writeAll = async (orgId: string, events: AnimalEvent[]): Promise<void> => {
  await AsyncStorage.setItem(KEY(orgId), JSON.stringify(events));
};

export const listAnimalEvents = async (
  orgId: string,
  animalId: string,
): Promise<AnimalEvent[]> => {
  const all = await readAll(orgId);
  return all
    .filter(e => e.animalId === animalId)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
};

export const createAnimalEvent = async (
  orgId: string,
  input: CreateAnimalEventInput,
): Promise<AnimalEvent> => {
  const all = await readAll(orgId);
  const now = new Date().toISOString();
  const event: AnimalEvent = { ...input, id: generateId(), createdAt: now };
  all.push(event);
  await writeAll(orgId, all);
  return event;
};

// ── Convenience: record intake event automatically on animal creation ─────────
export const recordIntakeEvent = async (
  orgId: string,
  animalId: string,
  animalCaseId: string,
  intakeSource: string,
  rescuedBy: string,
): Promise<void> => {
  await createAnimalEvent(orgId, {
    animalId,
    organizationId: orgId,
    eventType: 'intake',
    title: `Intake — ${intakeSource.replace('_', ' ')}`,
    description: `Animal registered with case ID ${animalCaseId}`,
    performedBy: rescuedBy || 'System',
    occurredAt: new Date().toISOString(),
  });
};
