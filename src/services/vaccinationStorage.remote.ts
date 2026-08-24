import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '../aws-exports';
import {
  CreateVaccinationInput,
  UpdateVaccinationInput,
  Vaccination,
} from '../models/Vaccination';
import { VaccinationStorage } from './vaccinationStorage';

function getEndpoint(path: string): string | null {
  const apis = (awsExports as any)?.aws_cloud_logic_custom || [];
  const api = apis[0];
  if (!api?.endpoint) return null;
  const base = String(api.endpoint).replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function authToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const url = getEndpoint(path);
  if (!url) throw new Error('API endpoint not configured');
  const token = await authToken();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as unknown as T;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Server returned ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const remoteVaccinationStorage: VaccinationStorage = {
  async list(petId) {
    const out = await request<{ items: Vaccination[] }>(
      'GET',
      `/pets/${encodeURIComponent(petId)}/vaccinations`,
    );
    return out.items || [];
  },

  async get(petId, vaccinationId) {
    return request<Vaccination>(
      'GET',
      `/pets/${encodeURIComponent(petId)}/vaccinations/${encodeURIComponent(vaccinationId)}`,
    );
  },

  async create(petId, input: CreateVaccinationInput) {
    return request<Vaccination>(
      'POST',
      `/pets/${encodeURIComponent(petId)}/vaccinations`,
      input,
    );
  },

  async update(petId, vaccinationId, patch: UpdateVaccinationInput) {
    return request<Vaccination>(
      'PATCH',
      `/pets/${encodeURIComponent(petId)}/vaccinations/${encodeURIComponent(vaccinationId)}`,
      patch,
    );
  },

  async delete(petId, vaccinationId) {
    await request<void>(
      'DELETE',
      `/pets/${encodeURIComponent(petId)}/vaccinations/${encodeURIComponent(vaccinationId)}`,
    );
  },
};
