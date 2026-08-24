// ─── Organization Model ───────────────────────────────────────────────────────

export type OrgPlan = 'free' | 'basic' | 'pro';

export interface Organization {
  id: string;
  name: string;               // "Paws Rescue Delhi"
  registrationNumber?: string;
  address: string;
  city: string;
  state?: string;
  contactEmail: string;
  contactPhone: string;
  capacity: number;           // Max animals the shelter can house
  currentCount: number;       // Live count (updated on each intake/outcome)
  logoUri?: string;
  plan: OrgPlan;
  createdAt: string;
  updatedAt: string;
}

export type CreateOrganizationInput = Omit<Organization, 'id' | 'currentCount' | 'createdAt' | 'updatedAt'>;
export type UpdateOrganizationInput = Partial<Omit<Organization, 'id' | 'createdAt'>>;
