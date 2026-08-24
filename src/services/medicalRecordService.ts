// ─── Medical Record Service ───────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicalRecord, CreateMedicalRecordInput, UpdateMedicalRecordInput } from '../models/MedicalRecord';

const KEY = (orgId: string) => `@petvue_medical_${orgId}`;

const USE_REMOTE = false;

const generateId = () => 'med_' + Date.now().toString(36) + Math.random().toString(36).slice(2);

const readAll = async (orgId: string): Promise<MedicalRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY(orgId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const writeAll = async (orgId: string, records: MedicalRecord[]): Promise<void> => {
  await AsyncStorage.setItem(KEY(orgId), JSON.stringify(records));
};

export const listMedicalRecords = async (
  orgId: string,
  animalId: string,
): Promise<MedicalRecord[]> => {
  const all = await readAll(orgId);
  return all
    .filter(r => r.animalId === animalId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
};

/**
 * Single-read bulk fetch — returns all records grouped by animalId.
 * Use this whenever you need records across ALL animals (MedicationSchedule,
 * VaccinationReport, etc.) to avoid N×AsyncStorage reads.
 */
export const listAllMedicalRecordsByAnimal = async (
  orgId: string,
): Promise<Record<string, MedicalRecord[]>> => {
  const all = await readAll(orgId);
  const grouped: Record<string, MedicalRecord[]> = {};
  for (const r of all) {
    if (!grouped[r.animalId]) grouped[r.animalId] = [];
    grouped[r.animalId].push(r);
  }
  // Sort each group newest first
  for (const animalId of Object.keys(grouped)) {
    grouped[animalId].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }
  return grouped;
};

/** Count active medications across entire shelter — O(1) reads */
export const countActiveMedications = async (orgId: string): Promise<number> => {
  const today = new Date();
  const all = await readAll(orgId);
  let count = 0;
  for (const r of all) {
    for (const med of r.medications || []) {
      const ended = med.endDate && new Date(med.endDate) < today;
      if (!ended) count++;
    }
  }
  return count;
};


export const getMedicalRecord = async (
  orgId: string,
  recordId: string,
): Promise<MedicalRecord | null> => {
  const all = await readAll(orgId);
  return all.find(r => r.id === recordId) ?? null;
};

export const createMedicalRecord = async (
  orgId: string,
  input: CreateMedicalRecordInput,
): Promise<MedicalRecord> => {
  const all = await readAll(orgId);
  const now = new Date().toISOString();
  const record: MedicalRecord = {
    ...input,
    id: generateId(),
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
  };
  all.push(record);
  await writeAll(orgId, all);
  return record;
};

export const updateMedicalRecord = async (
  orgId: string,
  recordId: string,
  patch: UpdateMedicalRecordInput,
): Promise<MedicalRecord> => {
  const all = await readAll(orgId);
  const idx = all.findIndex(r => r.id === recordId);
  if (idx === -1) throw new Error(`Medical record ${recordId} not found`);
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  await writeAll(orgId, all);
  return updated;
};

export const deleteMedicalRecord = async (orgId: string, recordId: string): Promise<void> => {
  const all = await readAll(orgId);
  await writeAll(orgId, all.filter(r => r.id !== recordId));
};
