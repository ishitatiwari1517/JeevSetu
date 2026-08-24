import {
  ActivityLog,
  CreateActivityLogInput,
  UpdateActivityLogInput,
} from '../models/ActivityLog';
import { petMetricsRequest, withRange } from './petMetricsHttp';
import { ActivityStorage } from './activityStorage';

export const remoteActivityStorage: ActivityStorage = {
  async list(petId, from, to) {
    const path = withRange(
      `/pets/${encodeURIComponent(petId)}/activities`,
      from,
      to,
    );
    const out = await petMetricsRequest<{ items: ActivityLog[] }>('GET', path);
    return out.items || [];
  },

  async get(petId, activityLogId) {
    return petMetricsRequest<ActivityLog>(
      'GET',
      `/pets/${encodeURIComponent(petId)}/activities/${encodeURIComponent(activityLogId)}`,
    );
  },

  async create(petId, input: CreateActivityLogInput) {
    return petMetricsRequest<ActivityLog>(
      'POST',
      `/pets/${encodeURIComponent(petId)}/activities`,
      input,
    );
  },

  async update(petId, activityLogId, patch: UpdateActivityLogInput) {
    return petMetricsRequest<ActivityLog>(
      'PATCH',
      `/pets/${encodeURIComponent(petId)}/activities/${encodeURIComponent(activityLogId)}`,
      patch,
    );
  },

  async delete(petId, activityLogId) {
    await petMetricsRequest<void>(
      'DELETE',
      `/pets/${encodeURIComponent(petId)}/activities/${encodeURIComponent(activityLogId)}`,
    );
  },
};
