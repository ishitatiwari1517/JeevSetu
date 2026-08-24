import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '../aws-exports';
import {
  Booking,
  CreateBookingInput,
  ListBookingsFilter,
  UpdateBookingInput,
} from '../models/Booking';
import { BookingStorage } from './bookingStorage';

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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
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

function buildListPath(filter?: ListBookingsFilter): string {
  const params = new URLSearchParams();
  if (filter?.petId) params.set('petId', filter.petId);
  if (filter?.status) params.set('status', filter.status);
  if (filter?.from) params.set('from', filter.from);
  if (filter?.to) params.set('to', filter.to);
  const qs = params.toString();
  return qs ? `/bookings?${qs}` : '/bookings';
}

export const remoteBookingStorage: BookingStorage = {
  async list(filter) {
    const out = await request<{ items: Booking[] }>('GET', buildListPath(filter));
    return out.items || [];
  },

  async get(bookingId) {
    return request<Booking>('GET', `/bookings/${encodeURIComponent(bookingId)}`);
  },

  async create(input: CreateBookingInput) {
    return request<Booking>('POST', '/bookings', input);
  },

  async update(bookingId, patch: UpdateBookingInput) {
    return request<Booking>(
      'PATCH',
      `/bookings/${encodeURIComponent(bookingId)}`,
      patch,
    );
  },

  async delete(bookingId) {
    await request<void>('DELETE', `/bookings/${encodeURIComponent(bookingId)}`);
  },
};
