import {
  CreateVaccinationInput,
  UpdateVaccinationInput,
  Vaccination,
} from '../models/Vaccination';
import { VaccinationStorage } from './vaccinationStorage';
import { localVaccinationStorage } from './vaccinationStorage.local';
import { remoteVaccinationStorage } from './vaccinationStorage.remote';

const USE_REMOTE = true;

const storage: VaccinationStorage = USE_REMOTE
  ? remoteVaccinationStorage
  : localVaccinationStorage;

export const listVaccinations = (petId: string): Promise<Vaccination[]> =>
  storage.list(petId);

export const getVaccination = (
  petId: string,
  vaccinationId: string,
): Promise<Vaccination | null> => storage.get(petId, vaccinationId);

export const createVaccination = (
  petId: string,
  input: CreateVaccinationInput,
): Promise<Vaccination> => storage.create(petId, input);

export const updateVaccination = (
  petId: string,
  vaccinationId: string,
  patch: UpdateVaccinationInput,
): Promise<Vaccination> => storage.update(petId, vaccinationId, patch);

export const deleteVaccination = (
  petId: string,
  vaccinationId: string,
): Promise<void> => storage.delete(petId, vaccinationId);
