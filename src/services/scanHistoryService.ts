import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { Scan, RecordScanInput } from '../models/Scan';
import { ScanHistoryStorage } from './scanHistoryStorage';
import { localScanHistoryStorage } from './scanHistoryStorage.local';
import { remoteScanHistoryStorage } from './scanHistoryStorage.remote';

const USE_REMOTE = false;

const storage: ScanHistoryStorage = USE_REMOTE ? remoteScanHistoryStorage : localScanHistoryStorage;

let cachedUserId: string | null = null;

const resolveUserId = async (): Promise<string> => {
  if (cachedUserId) return cachedUserId;
  try {
    const { userId } = await getCurrentUser();
    cachedUserId = userId;
    return userId;
  } catch {
    const attrs = await fetchUserAttributes();
    const sub = attrs.sub;
    if (!sub) throw new Error('No authenticated user; cannot resolve scan owner.');
    cachedUserId = sub;
    return sub;
  }
};

export const __invalidateScanUserCache = (): void => {
  cachedUserId = null;
};

export const listScans = async (): Promise<Scan[]> => {
  const userId = await resolveUserId();
  return storage.list(userId);
};

export const getScan = async (scanId: string): Promise<Scan | null> => {
  const userId = await resolveUserId();
  return storage.get(userId, scanId);
};

export const recordScan = async (input: RecordScanInput): Promise<Scan> => {
  const userId = await resolveUserId();
  return storage.record(userId, input);
};

export const listScansByAnimal = async (animalId: string): Promise<Scan[]> => {
  const all = await listScans();
  // Strict match — only scans tagged to this specific animal.
  return all.filter(s => s.animalId === animalId);
};
