import {
  CreateWeightLogInput,
  UpdateWeightLogInput,
  WeightLog,
} from '../models/WeightLog';
import { petMetricsRequest, withRange } from './petMetricsHttp';
import { WeightStorage } from './weightStorage';

export const remoteWeightStorage: WeightStorage = {
  async list(petId, from, to) {
    const path = withRange(
      `/pets/${encodeURIComponent(petId)}/weights`,
      from,
      to,
    );
    const out = await petMetricsRequest<{ items: WeightLog[] }>('GET', path);
    return out.items || [];
  },

  async get(petId, weightLogId) {
    return petMetricsRequest<WeightLog>(
      'GET',
      `/pets/${encodeURIComponent(petId)}/weights/${encodeURIComponent(weightLogId)}`,
    );
  },

  async create(petId, input: CreateWeightLogInput) {
    return petMetricsRequest<WeightLog>(
      'POST',
      `/pets/${encodeURIComponent(petId)}/weights`,
      input,
    );
  },

  async update(petId, weightLogId, patch: UpdateWeightLogInput) {
    return petMetricsRequest<WeightLog>(
      'PATCH',
      `/pets/${encodeURIComponent(petId)}/weights/${encodeURIComponent(weightLogId)}`,
      patch,
    );
  },

  async delete(petId, weightLogId) {
    await petMetricsRequest<void>(
      'DELETE',
      `/pets/${encodeURIComponent(petId)}/weights/${encodeURIComponent(weightLogId)}`,
    );
  },
};
