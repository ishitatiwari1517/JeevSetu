import {
  CreateWeightLogInput,
  UpdateWeightLogInput,
  WeightLog,
} from '../models/WeightLog';
import { remoteWeightStorage } from './weightStorage.remote';
import { WeightStorage } from './weightStorage';

const storage: WeightStorage = remoteWeightStorage;

export const listWeights = (
  petId: string,
  from?: string,
  to?: string,
): Promise<WeightLog[]> => storage.list(petId, from, to);

export const getWeight = (
  petId: string,
  weightLogId: string,
): Promise<WeightLog | null> => storage.get(petId, weightLogId);

export const createWeight = (
  petId: string,
  input: CreateWeightLogInput,
): Promise<WeightLog> => storage.create(petId, input);

export const updateWeight = (
  petId: string,
  weightLogId: string,
  patch: UpdateWeightLogInput,
): Promise<WeightLog> => storage.update(petId, weightLogId, patch);

export const deleteWeight = (
  petId: string,
  weightLogId: string,
): Promise<void> => storage.delete(petId, weightLogId);
