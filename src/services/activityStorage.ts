import {
  ActivityLog,
  CreateActivityLogInput,
  UpdateActivityLogInput,
} from '../models/ActivityLog';

export interface ActivityStorage {
  list(petId: string, from?: string, to?: string): Promise<ActivityLog[]>;
  get(petId: string, activityLogId: string): Promise<ActivityLog | null>;
  create(petId: string, input: CreateActivityLogInput): Promise<ActivityLog>;
  update(
    petId: string,
    activityLogId: string,
    patch: UpdateActivityLogInput,
  ): Promise<ActivityLog>;
  delete(petId: string, activityLogId: string): Promise<void>;
}
