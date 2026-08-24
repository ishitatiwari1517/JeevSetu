import {
  CreateVaccinationInput,
  UpdateVaccinationInput,
  Vaccination,
} from '../models/Vaccination';

export interface VaccinationStorage {
  list(petId: string): Promise<Vaccination[]>;
  get(petId: string, vaccinationId: string): Promise<Vaccination | null>;
  create(petId: string, input: CreateVaccinationInput): Promise<Vaccination>;
  update(
    petId: string,
    vaccinationId: string,
    patch: UpdateVaccinationInput,
  ): Promise<Vaccination>;
  delete(petId: string, vaccinationId: string): Promise<void>;
}
