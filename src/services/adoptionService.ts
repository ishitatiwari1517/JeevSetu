// ─── Adoption Application Service ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdoptionApplication, CreateAdoptionApplicationInput, UpdateAdoptionApplicationInput } from '../models/AdoptionApplication';

const KEY = (orgId: string) => `@petvue_adoptions_${orgId}`;
const genId = () => 'adpt_' + Date.now().toString(36) + Math.random().toString(36).slice(2);

const readAll  = async (orgId: string): Promise<AdoptionApplication[]> => { try { const r = await AsyncStorage.getItem(KEY(orgId)); return r ? JSON.parse(r) : []; } catch { return []; } };
const writeAll = (orgId: string, data: AdoptionApplication[]) => AsyncStorage.setItem(KEY(orgId), JSON.stringify(data));

export const listAdoptionApplications = async (orgId: string, animalId?: string): Promise<AdoptionApplication[]> => {
  const all = await readAll(orgId);
  return (animalId ? all.filter(a => a.animalId === animalId) : all)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const getAdoptionApplication = async (orgId: string, id: string): Promise<AdoptionApplication | null> =>
  (await readAll(orgId)).find(a => a.id === id) ?? null;

export const createAdoptionApplication = async (orgId: string, input: CreateAdoptionApplicationInput): Promise<AdoptionApplication> => {
  const all = await readAll(orgId);
  const now = new Date().toISOString();
  const app: AdoptionApplication = {
    ...input,
    id: genId(),
    organizationId: orgId,
    status: 'submitted',
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  all.push(app);
  await writeAll(orgId, all);
  return app;
};

export const updateAdoptionApplication = async (orgId: string, id: string, patch: UpdateAdoptionApplicationInput): Promise<AdoptionApplication> => {
  const all = await readAll(orgId);
  const idx = all.findIndex(a => a.id === id);
  if (idx === -1) throw new Error(`Application ${id} not found`);
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  await writeAll(orgId, all);
  return updated;
};

export const getAdoptionStats = async (orgId: string) => {
  const all = await readAll(orgId);
  return {
    total:       all.length,
    submitted:   all.filter(a => a.status === 'submitted').length,
    underReview: all.filter(a => a.status === 'under_review').length,
    approved:    all.filter(a => a.status === 'approved').length,
    completed:   all.filter(a => a.status === 'completed').length,
  };
};
