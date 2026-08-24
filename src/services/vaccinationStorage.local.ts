import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CreateVaccinationInput,
  UpdateVaccinationInput,
  Vaccination,
} from '../models/Vaccination';
import { VaccinationStorage } from './vaccinationStorage';

const KEY_PREFIX = '@vaccinations_';

const keyFor = (petId: string) => `${KEY_PREFIX}${petId}`;

const readAll = async (petId: string): Promise<Vaccination[]> => {
  const raw = await AsyncStorage.getItem(keyFor(petId));
  return raw ? (JSON.parse(raw) as Vaccination[]) : [];
};

const writeAll = async (petId: string, items: Vaccination[]) => {
  await AsyncStorage.setItem(keyFor(petId), JSON.stringify(items));
};

const newId = () =>
  `vac-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const localVaccinationStorage: VaccinationStorage = {
  async list(petId) {
    return readAll(petId);
  },

  async get(petId, vaccinationId) {
    const items = await readAll(petId);
    return items.find(v => v.vaccinationId === vaccinationId) || null;
  },

  async create(petId, input: CreateVaccinationInput) {
    const now = new Date().toISOString();
    const item: Vaccination = {
      vaccinationId: newId(),
      petId,
      userId: 'local',
      vaccineName: input.vaccineName,
      dueDate: input.dueDate,
      administeredDate: input.administeredDate,
      veterinarian: input.veterinarian,
      notes: input.notes,
      status: input.status ?? (input.administeredDate ? 'completed' : 'scheduled'),
      createdAt: now,
      updatedAt: now,
    };
    const items = await readAll(petId);
    items.push(item);
    await writeAll(petId, items);
    return item;
  },

  async update(petId, vaccinationId, patch: UpdateVaccinationInput) {
    const items = await readAll(petId);
    const idx = items.findIndex(v => v.vaccinationId === vaccinationId);
    if (idx < 0) throw new Error('Vaccination not found');
    const updated: Vaccination = {
      ...items[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    items[idx] = updated;
    await writeAll(petId, items);
    return updated;
  },

  async delete(petId, vaccinationId) {
    const items = await readAll(petId);
    const next = items.filter(v => v.vaccinationId !== vaccinationId);
    await writeAll(petId, next);
  },
};
