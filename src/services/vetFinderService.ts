import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '../aws-exports';
import { NearbyVetsQuery, VetPlace, VetPlaceDetails } from '../models/VetPlace';

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

async function request<T>(path: string): Promise<T> {
  const url = getEndpoint(path);
  if (!url) throw new Error('API endpoint not configured');
  const token = await authToken();
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: token },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Server returned ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function findNearbyVets(
  query: NearbyVetsQuery,
): Promise<{ items: VetPlace[]; cached: boolean }> {
  const params = new URLSearchParams({
    lat: String(query.latitude),
    lng: String(query.longitude),
  });
  if (query.radiusMeters != null) {
    params.set('radius', String(query.radiusMeters));
  }
  if (query.keyword) params.set('keyword', query.keyword);
  return request<{ items: VetPlace[]; cached: boolean }>(
    `/vets/nearby?${params.toString()}`,
  );
}

export async function getVetDetails(
  placeId: string,
): Promise<VetPlaceDetails & { cached: boolean }> {
  return request<VetPlaceDetails & { cached: boolean }>(
    `/vets/${encodeURIComponent(placeId)}`,
  );
}
