// ─── Animal Service ───────────────────────────────────────────────────────────
// Public API for all animal operations. Swap USE_REMOTE to true when AWS is ready.

import { Animal, CreateAnimalInput, UpdateAnimalInput, ListAnimalsFilter } from '../models/Animal';
import { AnimalStorage } from './animalStorage';
import { localAnimalStorage } from './animalStorage.local';
import { remoteAnimalStorage } from './animalStorage.remote';
import { getOrganization } from './orgService';

// ── Config ────────────────────────────────────────────────────────────────────
const USE_REMOTE = false; // Flip to true when AWS backend is ready

const storage: AnimalStorage = USE_REMOTE ? remoteAnimalStorage : localAnimalStorage;

// ── Org ID resolver ───────────────────────────────────────────────────────────
// IMPORTANT: Must always return the SAME key across all calls.
// Previously this fell back to Cognito userId which could fail or return
// different values, splitting animals across multiple storage buckets.
const FALLBACK_ORG_ID = 'default';
let _cachedOrgId: string | null = null;

const resolveOrgId = async (): Promise<string> => {
  if (_cachedOrgId) return _cachedOrgId;
  try {
    const org = await getOrganization();
    if (org?.id) {
      _cachedOrgId = org.id;
      return org.id;
    }
  } catch { /* fall through to stable default */ }
  // Always use the same stable fallback — never Cognito userId
  // This ensures all animals are in one bucket regardless of auth state
  _cachedOrgId = FALLBACK_ORG_ID;
  return FALLBACK_ORG_ID;
};

export const __invalidateAnimalOrgCache = (): void => { _cachedOrgId = null; };

// ── Public API ────────────────────────────────────────────────────────────────

export const listAnimals = async (filter?: ListAnimalsFilter): Promise<Animal[]> => {
  const orgId = await resolveOrgId();
  return storage.list(orgId, filter);
};

export const getAnimal = async (animalId: string): Promise<Animal | null> => {
  const orgId = await resolveOrgId();
  return storage.get(orgId, animalId);
};

export const createAnimal = async (input: CreateAnimalInput): Promise<Animal> => {
  const orgId = await resolveOrgId();
  return storage.create(orgId, input);
};

export const updateAnimal = async (animalId: string, patch: UpdateAnimalInput): Promise<Animal> => {
  const orgId = await resolveOrgId();
  return storage.update(orgId, animalId, patch);
};

export const deleteAnimal = async (animalId: string): Promise<void> => {
  const orgId = await resolveOrgId();
  return storage.delete(orgId, animalId);
};

// ── Convenience helpers ───────────────────────────────────────────────────────

export const getAnimalStats = async (): Promise<{
  total: number;
  critical: number;
  available: number;
  needsAttention: number;
}> => {
  const animals = await listAnimals();
  return {
    total: animals.length,
    critical: animals.filter(a => a.healthStatus === 'critical').length,
    available: animals.filter(a => a.status === 'available').length,
    needsAttention: animals.filter(
      a => a.healthStatus === 'critical' || a.healthStatus === 'needs_attention',
    ).length,
  };
};
