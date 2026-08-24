export type WeightSource = 'manual' | 'vet-visit' | 'home-scale';

export interface WeightLog {
  weightLogId: string;
  petId: string;
  userId: string;
  weightKg: number;
  loggedAt: string;
  source?: WeightSource;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateWeightLogInput = {
  weightKg: number;
  loggedAt: string;
  source?: WeightSource;
  notes?: string;
};

export type UpdateWeightLogInput = Partial<
  Pick<WeightLog, 'weightKg' | 'loggedAt' | 'source' | 'notes'>
>;
