// ─── Volunteer Local Storage ──────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Volunteer, VolunteerShift, VolunteerTask, CreateVolunteerInput, CreateShiftInput, CreateTaskInput, UpdateTaskInput } from '../models/Volunteer';

const VOLS_KEY   = (orgId: string) => `@petvue_volunteers_${orgId}`;
const SHIFTS_KEY = (orgId: string) => `@petvue_shifts_${orgId}`;
const TASKS_KEY  = (orgId: string) => `@petvue_tasks_${orgId}`;

const genId = (prefix = '') => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ── Volunteers ────────────────────────────────────────────────────────────────
const readVols   = async (orgId: string): Promise<Volunteer[]> => { try { const r = await AsyncStorage.getItem(VOLS_KEY(orgId)); return r ? JSON.parse(r) : []; } catch { return []; } };
const writeVols  = (orgId: string, data: Volunteer[]) => AsyncStorage.setItem(VOLS_KEY(orgId), JSON.stringify(data));

export const listVolunteers = async (orgId: string): Promise<Volunteer[]> =>
  (await readVols(orgId)).sort((a, b) => a.name.localeCompare(b.name));

export const getVolunteer = async (orgId: string, id: string): Promise<Volunteer | null> =>
  (await readVols(orgId)).find(v => v.id === id) ?? null;

export const createVolunteer = async (orgId: string, input: CreateVolunteerInput): Promise<Volunteer> => {
  const vols = await readVols(orgId);
  const now  = new Date().toISOString();
  const vol: Volunteer = {
    ...input,
    id: genId('vol_'),
    organizationId: orgId,
    totalHoursLogged: 0,
    totalShiftsCompleted: 0,
    totalShiftsMissed: 0,
    onboardingCompleted: input.onboardingCompleted ?? false,
    idVerified: input.idVerified ?? false,
    status: input.status ?? 'active',
    joinedAt: input.joinedAt ?? now,
    skills: input.skills ?? [],
    availableDays: input.availableDays ?? [],
    canDoMedicalAssist: input.canDoMedicalAssist ?? false,
    canDoRescue: input.canDoRescue ?? false,
    canDrive: input.canDrive ?? false,
    canFoster: input.canFoster ?? false,
    vehicleAvailable: input.vehicleAvailable ?? false,
    createdAt: now,
    updatedAt: now,
  };
  vols.push(vol);
  await writeVols(orgId, vols);
  return vol;
};

export const updateVolunteer = async (orgId: string, id: string, patch: Partial<Volunteer>): Promise<Volunteer> => {
  const vols = await readVols(orgId);
  const idx  = vols.findIndex(v => v.id === id);
  if (idx === -1) throw new Error(`Volunteer ${id} not found`);
  const updated = { ...vols[idx], ...patch, updatedAt: new Date().toISOString() };
  vols[idx] = updated;
  await writeVols(orgId, vols);
  return updated;
};

export const deleteVolunteer = async (orgId: string, id: string): Promise<void> =>
  writeVols(orgId, (await readVols(orgId)).filter(v => v.id !== id));

// ── Tasks ─────────────────────────────────────────────────────────────────────
const readTasks  = async (orgId: string): Promise<VolunteerTask[]> => { try { const r = await AsyncStorage.getItem(TASKS_KEY(orgId)); return r ? JSON.parse(r) : []; } catch { return []; } };
const writeTasks = (orgId: string, data: VolunteerTask[]) => AsyncStorage.setItem(TASKS_KEY(orgId), JSON.stringify(data));

export const listTasks = async (orgId: string, volunteerId?: string): Promise<VolunteerTask[]> => {
  const tasks = await readTasks(orgId);
  return (volunteerId ? tasks.filter(t => t.assignedTo === volunteerId) : tasks)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
};

export const createTask = async (orgId: string, input: CreateTaskInput): Promise<VolunteerTask> => {
  const tasks = await readTasks(orgId);
  const now   = new Date().toISOString();
  const task: VolunteerTask = { ...input, id: genId('task_'), organizationId: orgId, createdAt: now, updatedAt: now };
  tasks.push(task);
  await writeTasks(orgId, tasks);
  return task;
};

export const updateTask = async (orgId: string, taskId: string, patch: UpdateTaskInput): Promise<VolunteerTask> => {
  const tasks = await readTasks(orgId);
  const idx   = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) throw new Error(`Task ${taskId} not found`);
  const updated = { ...tasks[idx], ...patch, updatedAt: new Date().toISOString() };
  tasks[idx] = updated;
  await writeTasks(orgId, tasks);
  return updated;
};

// ── Volunteer stats helper ─────────────────────────────────────────────────────
export const getVolunteerStats = async (orgId: string) => {
  const vols = await listVolunteers(orgId);
  return {
    total:  vols.length,
    active: vols.filter(v => v.status === 'active').length,
    canFoster: vols.filter(v => v.canFoster).length,
    canRescue: vols.filter(v => v.canDoRescue).length,
  };
};
