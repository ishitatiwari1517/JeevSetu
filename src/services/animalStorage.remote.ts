// ─── Animal Remote Storage (stub) ─────────────────────────────────────────────
// Placeholder for AWS API integration. Flip USE_REMOTE in animalService.ts
// to true and implement these methods when ready to go live.

import { Animal, CreateAnimalInput, UpdateAnimalInput, ListAnimalsFilter } from '../models/Animal';
import { AnimalStorage } from './animalStorage';

export const remoteAnimalStorage: AnimalStorage = {
  list: async (_orgId: string, _filter?: ListAnimalsFilter): Promise<Animal[]> => {
    throw new Error('Remote animal storage not yet implemented. Set USE_REMOTE = false.');
  },
  get: async (_orgId: string, _animalId: string): Promise<Animal | null> => {
    throw new Error('Remote animal storage not yet implemented.');
  },
  create: async (_orgId: string, _input: CreateAnimalInput): Promise<Animal> => {
    throw new Error('Remote animal storage not yet implemented.');
  },
  update: async (_orgId: string, _animalId: string, _patch: UpdateAnimalInput): Promise<Animal> => {
    throw new Error('Remote animal storage not yet implemented.');
  },
  delete: async (_orgId: string, _animalId: string): Promise<void> => {
    throw new Error('Remote animal storage not yet implemented.');
  },
};
