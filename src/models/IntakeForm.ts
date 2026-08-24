export type Severity = 'mild' | 'moderate' | 'severe';

export type SymptomId = 'vomiting' | 'lethargy' | 'eating' | 'limping' | 'checkup' | 'other';

export interface IntakeFormData {
  petId: string;
  petName: string;
  appointmentId: string;
  symptoms: SymptomId[];
  otherSymptom: string;
  severity: Severity | '';
  duration: string;
  frequency: string;
  changes: string[];
  notes: string;
}

export interface IntakeFormDraft extends IntakeFormData {
  draftId: string;
  savedAt: string;
}

export interface IntakeFormSubmission extends IntakeFormData {
  submissionId: string;
  submittedAt: string;
}
