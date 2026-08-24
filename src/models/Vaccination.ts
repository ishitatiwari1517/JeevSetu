export type VaccinationStatus = 'scheduled' | 'completed' | 'overdue';

export interface Vaccination {
  vaccinationId: string;
  petId: string;
  userId: string;
  vaccineName: string;
  administeredDate?: string;
  dueDate: string;
  veterinarian?: string;
  notes?: string;
  status: VaccinationStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateVaccinationInput = {
  vaccineName: string;
  dueDate: string;
  administeredDate?: string;
  veterinarian?: string;
  notes?: string;
  status?: VaccinationStatus;
};

export type UpdateVaccinationInput = Partial<
  Pick<
    Vaccination,
    'vaccineName' | 'administeredDate' | 'dueDate' | 'veterinarian' | 'notes' | 'status'
  >
>;
