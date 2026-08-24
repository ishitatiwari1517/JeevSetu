// ─── Medical Record Model ─────────────────────────────────────────────────────
// Every health event in an animal's life — checkups, surgeries, AI scans, meds.

export type MedicalRecordType =
  | 'checkup'
  | 'surgery'
  | 'treatment'
  | 'ai_scan'
  | 'lab_result'
  | 'medication_log'
  | 'injury'
  | 'observation'
  | 'deworming'
  | 'vaccination';

export interface MedicationEntry {
  name: string;
  dosage: string;           // "5mg", "1 tablet"
  frequency: string;        // "Twice daily", "Every 8 hours"
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  animalId: string;
  organizationId: string;
  recordedBy: string;       // Staff / volunteer name
  recordType: MedicalRecordType;
  title: string;            // "Deworming", "Spay Surgery", "AI Health Scan"
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: MedicationEntry[];
  cost?: number;            // In INR — critical for NGO budget tracking
  vetName?: string;
  vetClinic?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  attachments?: string[];   // Photo URIs
  aiGenerated: boolean;     // true = came from AI scan
  aiScanResult?: object;    // raw AI scan payload if aiGenerated
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateMedicalRecordInput = Omit<
  MedicalRecord,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateMedicalRecordInput = Partial<
  Omit<MedicalRecord, 'id' | 'animalId' | 'organizationId' | 'createdAt'>
>;
