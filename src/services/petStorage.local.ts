import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, CreatePetInput, UpdatePetInput } from '../models/Pet';
import { PetStorage } from './petStorage';

const KEY_PREFIX = '@petvue/pets/';
const userKey = (userId: string) => `${KEY_PREFIX}${userId}`;

// RFC 4122 v4 UUID. crypto.getRandomValues is polyfilled by react-native-get-random-values.
/* eslint-disable no-bitwise */
const newId = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
};
/* eslint-enable no-bitwise */

const readAll = async (userId: string): Promise<Pet[]> => {
  const raw = await AsyncStorage.getItem(userKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Pet[]) : [];
  } catch {
    return [];
  }
};

const writeAll = async (userId: string, pets: Pet[]): Promise<void> => {
  await AsyncStorage.setItem(userKey(userId), JSON.stringify(pets));
};

export const localPetStorage: PetStorage = {
  async list(userId) {
    return readAll(userId);
  },

  async get(userId, petId) {
    const pets = await readAll(userId);
    return pets.find(p => p.id === petId) ?? null;
  },

  async create(userId, input) {
    const now = new Date().toISOString();
    const pet: Pet = {
      id: newId(),
      userId,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    const pets = await readAll(userId);
    await writeAll(userId, [...pets, pet]);
    return pet;
  },

  async update(userId, petId, patch) {
    const pets = await readAll(userId);
    const idx = pets.findIndex(p => p.id === petId);
    if (idx === -1) throw new Error(`Pet not found: ${petId}`);
    const updated: Pet = {
      ...pets[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const next = [...pets];
    next[idx] = updated;
    await writeAll(userId, next);
    return updated;
  },

  async delete(userId, petId) {
    const pets = await readAll(userId);
    await writeAll(userId, pets.filter(p => p.id !== petId));
  },

  async setAvatar(userId, petId, localUri) {
    return this.update(userId, petId, { avatarUri: localUri } as UpdatePetInput);
  },
};

// Helper exported for tests / debugging only.
export const __unsafeResetForUser = async (userId: string): Promise<void> => {
  await AsyncStorage.removeItem(userKey(userId));
};

// Re-export for callers that want the input types together.
export type { CreatePetInput };
