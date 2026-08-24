import {
  CreateWeightLogInput,
  UpdateWeightLogInput,
  WeightLog,
} from '../models/WeightLog';

export interface WeightStorage {
  list(petId: string, from?: string, to?: string): Promise<WeightLog[]>;
  get(petId: string, weightLogId: string): Promise<WeightLog | null>;
  create(petId: string, input: CreateWeightLogInput): Promise<WeightLog>;
  update(
    petId: string,
    weightLogId: string,
    patch: UpdateWeightLogInput,
  ): Promise<WeightLog>;
  delete(petId: string, weightLogId: string): Promise<void>;
}
