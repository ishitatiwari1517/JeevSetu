import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scan } from '../models/Scan';
import { ScanHistoryStorage } from './scanHistoryStorage';

const KEY_PREFIX = '@petvue/scans/';
const userKey = (userId: string) => `${KEY_PREFIX}${userId}`;

// RFC 4122 v4. crypto.getRandomValues is polyfilled by react-native-get-random-values.
/* eslint-disable no-bitwise */
const newId = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
};
/* eslint-enable no-bitwise */

const readAll = async (userId: string): Promise<Scan[]> => {
  const raw = await AsyncStorage.getItem(userKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Scan[]) : [];
  } catch {
    return [];
  }
};

const writeAll = async (userId: string, scans: Scan[]): Promise<void> => {
  await AsyncStorage.setItem(userKey(userId), JSON.stringify(scans));
};

export const localScanHistoryStorage: ScanHistoryStorage = {
  async list(userId) {
    const scans = await readAll(userId);
    // Newest first.
    return [...scans].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(userId, scanId) {
    const scans = await readAll(userId);
    return scans.find(s => s.id === scanId) ?? null;
  },

  async record(userId, input) {
    const scan: Scan = {
      id: newId(),
      userId,
      petId: input.petId,
      result: input.result,
      heroUri: input.heroUri,
      imageCount: input.imageCount,
      createdAt: new Date().toISOString(),
    };
    const existing = await readAll(userId);
    await writeAll(userId, [...existing, scan]);
    return scan;
  },
};

// Test/debug helper.
export const __unsafeResetForUser = async (userId: string): Promise<void> => {
  await AsyncStorage.removeItem(userKey(userId));
};
