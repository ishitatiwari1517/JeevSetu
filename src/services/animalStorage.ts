// ─── Animal Storage Interface ─────────────────────────────────────────────────
import { Animal, CreateAnimalInput, UpdateAnimalInput, ListAnimalsFilter } from '../models/Animal';

export interface AnimalStorage {
  list(orgId: string, filter?: ListAnimalsFilter): Promise<Animal[]>;
  get(orgId: string, animalId: string): Promise<Animal | null>;
  create(orgId: string, input: CreateAnimalInput): Promise<Animal>;
  update(orgId: string, animalId: string, patch: UpdateAnimalInput): Promise<Animal>;
  delete(orgId: string, animalId: string): Promise<void>;
}
