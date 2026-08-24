import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { Pet, CreatePetInput, UpdatePetInput } from '../models/Pet';
import { PetStorage } from './petStorage';
import { localPetStorage } from './petStorage.local';
import { remotePetStorage } from './petStorage.remote';

const USE_REMOTE = false;

const storage: PetStorage = USE_REMOTE ? remotePetStorage : localPetStorage;

let cachedUserId: string | null = null;

const resolveUserId = async (): Promise<string> => {
  if (cachedUserId) return cachedUserId;
  try {
    const { userId } = await getCurrentUser();
    cachedUserId = userId;
    return userId;
  } catch {
    const attrs = await fetchUserAttributes();
    const sub = attrs.sub;
    if (!sub) throw new Error('No authenticated user; cannot resolve pet owner.');
    cachedUserId = sub;
    return sub;
  }
};

export const __invalidatePetUserCache = (): void => {
  cachedUserId = null;
};

export const listPets = async (): Promise<Pet[]> => {
  const userId = await resolveUserId();
  return storage.list(userId);
};

export const getPet = async (petId: string): Promise<Pet | null> => {
  const userId = await resolveUserId();
  return storage.get(userId, petId);
};

export const createPet = async (input: CreatePetInput): Promise<Pet> => {
  const userId = await resolveUserId();
  return storage.create(userId, input);
};

export const updatePet = async (petId: string, patch: UpdatePetInput): Promise<Pet> => {
  const userId = await resolveUserId();
  return storage.update(userId, petId, patch);
};

export const deletePet = async (petId: string): Promise<void> => {
  const userId = await resolveUserId();
  return storage.delete(userId, petId);
};

export const setPetAvatar = async (petId: string, localUri: string): Promise<Pet> => {
  const userId = await resolveUserId();
  return storage.setAvatar(userId, petId, localUri);
};
