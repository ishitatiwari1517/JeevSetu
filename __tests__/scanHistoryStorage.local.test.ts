jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  localScanHistoryStorage,
  __unsafeResetForUser,
} from '../src/services/scanHistoryStorage.local';
import type { ScanResult } from '../src/services/scanResult';

const USER = 'user-abc';

const SAMPLE_RESULT: ScanResult = {
  subjectDetected: true,
  imageQuality: 'good',
  findings: [{
    condition: 'Mange',
    confidence: 78,
    severity: 'SEE_VET',
    visibleIndicators: ['hair loss'],
    plainLanguage: 'Mange — hair loss and skin irritation',
  }],
  overallStatus: 'NEEDS_ATTENTION',
  recommendation: 'See a vet within the week.',
  disclaimer: 'AI triage only.',
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await __unsafeResetForUser(USER);
});

test('record writes a scan with server-shaped id and createdAt', async () => {
  const scan = await localScanHistoryStorage.record(USER, {
    result: SAMPLE_RESULT, imageCount: 3,
  });
  expect(scan.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(scan.userId).toBe(USER);
  expect(scan.imageCount).toBe(3);
  expect(scan.createdAt).toBeDefined();
  expect(scan.result.findings[0].condition).toBe('Mange');
});

test('list returns newest first', async () => {
  await localScanHistoryStorage.record(USER, { result: SAMPLE_RESULT, imageCount: 2 });
  await new Promise<void>(r => setTimeout(r, 5));
  const second = await localScanHistoryStorage.record(USER, { result: SAMPLE_RESULT, imageCount: 4 });
  await new Promise<void>(r => setTimeout(r, 5));
  await localScanHistoryStorage.record(USER, { result: SAMPLE_RESULT, imageCount: 5 });

  const list = await localScanHistoryStorage.list(USER);
  expect(list.length).toBe(3);
  expect(list[0].imageCount).toBe(5);
  expect(list[1].id).toBe(second.id);
});

test('list scopes by userId', async () => {
  await localScanHistoryStorage.record(USER, { result: SAMPLE_RESULT, imageCount: 2 });
  await localScanHistoryStorage.record('other-user', { result: SAMPLE_RESULT, imageCount: 3 });

  const mine = await localScanHistoryStorage.list(USER);
  const theirs = await localScanHistoryStorage.list('other-user');
  expect(mine.length).toBe(1);
  expect(theirs.length).toBe(1);
  expect(mine[0].userId).toBe(USER);
});

test('get returns the matching scan or null', async () => {
  const scan = await localScanHistoryStorage.record(USER, { result: SAMPLE_RESULT, imageCount: 2 });
  const fetched = await localScanHistoryStorage.get(USER, scan.id);
  expect(fetched?.id).toBe(scan.id);

  const missing = await localScanHistoryStorage.get(USER, 'no-such-id');
  expect(missing).toBeNull();
});

test('persists petId and heroUri when supplied', async () => {
  const scan = await localScanHistoryStorage.record(USER, {
    result: SAMPLE_RESULT,
    imageCount: 2,
    petId: 'pet-123',
    heroUri: 'file:///tmp/hero.jpg',
  });
  expect(scan.petId).toBe('pet-123');
  expect(scan.heroUri).toBe('file:///tmp/hero.jpg');
});
