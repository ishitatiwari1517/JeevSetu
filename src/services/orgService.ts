// ─── Organization Service ─────────────────────────────────────────────────────
// Manages the single organization profile for this PetVue installation.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '../models/Organization';

const ORG_KEY = '@petvue_organization';

const generateId = (): string =>
  'org_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const getOrganization = async (): Promise<Organization | null> => {
  try {
    const raw = await AsyncStorage.getItem(ORG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const createOrganization = async (input: CreateOrganizationInput): Promise<Organization> => {
  const now = new Date().toISOString();
  const org: Organization = {
    ...input,
    id: generateId(),
    currentCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await AsyncStorage.setItem(ORG_KEY, JSON.stringify(org));
  return org;
};

export const updateOrganization = async (patch: UpdateOrganizationInput): Promise<Organization> => {
  const org = await getOrganization();
  if (!org) throw new Error('No organization found. Please set up your organization first.');
  const updated: Organization = { ...org, ...patch, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(ORG_KEY, JSON.stringify(updated));
  return updated;
};

export const ensureDefaultOrganization = async (): Promise<Organization> => {
  const existing = await getOrganization();
  if (existing) return existing;
  // Create a default org for first-time setup
  return createOrganization({
    name: 'My Shelter',
    address: '',
    city: '',
    contactEmail: '',
    contactPhone: '',
    capacity: 100,
    plan: 'free',
  });
};
