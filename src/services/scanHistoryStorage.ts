import { Scan, RecordScanInput } from '../models/Scan';

export interface ScanHistoryStorage {
  list(userId: string): Promise<Scan[]>;
  get(userId: string, scanId: string): Promise<Scan | null>;
  record(userId: string, input: RecordScanInput): Promise<Scan>;
}
