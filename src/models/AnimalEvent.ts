// ─── Animal Event Model ───────────────────────────────────────────────────────
// The immutable timeline of everything that has happened to an animal.
// Events are auto-created by the system on key actions — never manually written.

export type AnimalEventType =
  | 'intake'
  | 'status_change'
  | 'medical'
  | 'vaccination'
  | 'photo_added'
  | 'note_updated'
  | 'kennel_changed'
  | 'carer_assigned'
  | 'foster_assigned'
  | 'foster_returned'
  | 'adoption_applied'
  | 'adoption_approved'
  | 'adoption_completed'
  | 'ai_scan'
  | 'weight_logged'
  | 'transfer';

export interface AnimalEvent {
  id: string;
  animalId: string;
  organizationId: string;
  eventType: AnimalEventType;
  title: string;          // "Intake — street rescue, Sector 14"
  description?: string;
  performedBy: string;    // Staff / volunteer name
  occurredAt: string;     // ISO timestamp
  metadata?: Record<string, unknown>;  // event-specific payload
  createdAt: string;
}

export type CreateAnimalEventInput = Omit<AnimalEvent, 'id' | 'createdAt'>;
