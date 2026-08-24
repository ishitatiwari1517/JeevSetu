import { ScanResult } from '../services/scanResult';

export interface Scan {
  id: string;
  userId: string;
  petId?: string;
  animalId?: string;    // Shelter animal (Animal model). Set when scan is done from AnimalDetailScreen.
  result: ScanResult;
  heroUri?: string;
  imageCount: number;
  createdAt: string;
}

export type RecordScanInput = {
  petId?: string;
  animalId?: string;
  result: ScanResult;
  heroUri?: string;
  imageCount: number;
};
