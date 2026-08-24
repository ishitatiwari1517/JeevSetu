// ─── Animal Local Storage ─────────────────────────────────────────────────────
// AsyncStorage implementation — offline-first, works without network.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animal, CreateAnimalInput, UpdateAnimalInput, ListAnimalsFilter } from '../models/Animal';
import { AnimalStorage } from './animalStorage';

const STORAGE_KEY = (orgId: string) => `@petvue_animals_${orgId}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const generateCaseId = (): string => {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `PV-${year}-${num}`;
};

const readAll = async (orgId: string): Promise<Animal[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY(orgId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeAll = async (orgId: string, animals: Animal[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY(orgId), JSON.stringify(animals));
};

const applyFilter = (animals: Animal[], filter?: ListAnimalsFilter): Animal[] => {
  if (!filter) return animals;
  let result = animals;

  if (filter.species)      result = result.filter(a => a.species === filter.species);
  if (filter.status)       result = result.filter(a => a.status === filter.status);
  if (filter.healthStatus) result = result.filter(a => a.healthStatus === filter.healthStatus);
  if (filter.isAdoptionReady !== undefined)
    result = result.filter(a => a.isAdoptionReady === filter.isAdoptionReady);
  if (filter.assignedCarerId)
    result = result.filter(a => a.assignedCarerId === filter.assignedCarerId);
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      a => a.name?.toLowerCase().includes(q) || a.caseId.toLowerCase().includes(q),
    );
  }
  return result;
};

// ── Implementation ────────────────────────────────────────────────────────────

export const localAnimalStorage: AnimalStorage = {
  list: async (orgId, filter) => {
    const animals = await readAll(orgId);
    return applyFilter(animals, filter).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  get: async (orgId, animalId) => {
    const animals = await readAll(orgId);
    return animals.find(a => a.id === animalId) ?? null;
  },

  create: async (orgId, input) => {
    const animals = await readAll(orgId);
    const now = new Date().toISOString();
    const animal: Animal = {
      ...input,
      id: generateId(),
      organizationId: orgId,
      caseId: generateCaseId(),
      isNeutered: input.isNeutered ?? false,
      isVaccinated: input.isVaccinated ?? false,
      isAdoptionReady: input.isAdoptionReady ?? false,
      adoptionListingPublic: input.adoptionListingPublic ?? false,
      photoUris: input.photoUris ?? [],
      createdAt: now,
      updatedAt: now,
    };
    animals.push(animal);
    await writeAll(orgId, animals);
    return animal;
  },

  update: async (orgId, animalId, patch) => {
    const animals = await readAll(orgId);
    const idx = animals.findIndex(a => a.id === animalId);
    if (idx === -1) throw new Error(`Animal ${animalId} not found`);
    const updated: Animal = { ...animals[idx], ...patch, updatedAt: new Date().toISOString() };
    animals[idx] = updated;
    await writeAll(orgId, animals);
    return updated;
  },

  delete: async (orgId, animalId) => {
    const animals = await readAll(orgId);
    await writeAll(orgId, animals.filter(a => a.id !== animalId));
  },
};
