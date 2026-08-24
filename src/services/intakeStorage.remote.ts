import { IntakeFormDraft, IntakeFormSubmission } from '../models/IntakeForm';
import { IntakeStorage } from './intakeStorage';
import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '../aws-exports';

import { localIntakeStorage } from './intakeStorage.local';

function getEndpoint(path: string): string | null {
  const apis = awsExports?.aws_cloud_logic_custom || [];
  const api = apis[0];
  if (!api?.endpoint) return null;
  const base = api.endpoint.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function postWithFetch(url: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = token;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Server returned ${res.status}: ${text}`);
  }
  return res.json();
}

export const remoteIntakeStorage: IntakeStorage = {
  saveDraft: async (draft: IntakeFormDraft) => {
    return localIntakeStorage.saveDraft(draft);
  },
  loadDraft: async (appointmentId: string) => {
    return localIntakeStorage.loadDraft(appointmentId);
  },
  deleteDraft: async (appointmentId: string) => {
    return localIntakeStorage.deleteDraft(appointmentId);
  },
  saveSubmission: async (submission: IntakeFormSubmission) => {
    const url = getEndpoint('/intake');
    if (!url) {
      throw new Error('API endpoint not configured');
    }
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    await postWithFetch(url, submission, token);
  },
  listSubmissions: async () => {
    throw new Error('Remote intake listSubmissions not implemented');
  },
};
