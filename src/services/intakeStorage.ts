import { IntakeFormDraft, IntakeFormSubmission } from '../models/IntakeForm';

export interface IntakeStorage {
  saveDraft(draft: IntakeFormDraft): Promise<void>;
  loadDraft(appointmentId: string): Promise<IntakeFormDraft | null>;
  deleteDraft(appointmentId: string): Promise<void>;
  saveSubmission(submission: IntakeFormSubmission): Promise<void>;
  listSubmissions(): Promise<IntakeFormSubmission[]>;
}
