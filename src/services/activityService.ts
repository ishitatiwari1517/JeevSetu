import {
  ActivityLog,
  CreateActivityLogInput,
  UpdateActivityLogInput,
} from '../models/ActivityLog';
import { remoteActivityStorage } from './activityStorage.remote';
import { ActivityStorage } from './activityStorage';

const storage: ActivityStorage = remoteActivityStorage;

export const listActivities = (
  petId: string,
  from?: string,
  to?: string,
): Promise<ActivityLog[]> => storage.list(petId, from, to);

export const getActivity = (
  petId: string,
  activityLogId: string,
): Promise<ActivityLog | null> => storage.get(petId, activityLogId);

export const createActivity = (
  petId: string,
  input: CreateActivityLogInput,
): Promise<ActivityLog> => storage.create(petId, input);

export const updateActivity = (
  petId: string,
  activityLogId: string,
  patch: UpdateActivityLogInput,
): Promise<ActivityLog> => storage.update(petId, activityLogId, patch);

export const deleteActivity = (
  petId: string,
  activityLogId: string,
): Promise<void> => storage.delete(petId, activityLogId);
