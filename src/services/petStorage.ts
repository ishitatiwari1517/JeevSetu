import { Pet, CreatePetInput, UpdatePetInput } from '../models/Pet';

export interface PetStorage {
  list(userId: string): Promise<Pet[]>;
  get(userId: string, petId: string): Promise<Pet | null>;
  create(userId: string, input: CreatePetInput): Promise<Pet>;
  update(userId: string, petId: string, patch: UpdatePetInput): Promise<Pet>;
  delete(userId: string, petId: string): Promise<void>;
  setAvatar(userId: string, petId: string, localUri: string): Promise<Pet>;
}
