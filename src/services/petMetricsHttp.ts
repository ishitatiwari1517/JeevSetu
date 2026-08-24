import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '../aws-exports';

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

export async function petMetricsRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
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

export function withRange(path: string, from?: string, to?: string): string {
  if (!from || !to) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}
