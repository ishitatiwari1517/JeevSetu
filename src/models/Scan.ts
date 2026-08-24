import { ScanResult } from '../services/scanResult';

export interface Scan {
  id: string;
  userId: string;
  petId?: string;
  result: ScanResult;
  heroUri?: string;
  imageCount: number;
  createdAt: string;
}

export type RecordScanInput = {
  petId?: string;
  result: ScanResult;
  heroUri?: string;
  imageCount: number;
};
