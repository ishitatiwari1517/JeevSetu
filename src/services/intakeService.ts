import { IntakeFormData, IntakeFormDraft, IntakeFormSubmission } from '../models/IntakeForm';
import { IntakeStorage } from './intakeStorage';
import { localIntakeStorage } from './intakeStorage.local';
import { remoteIntakeStorage } from './intakeStorage.remote';

const USE_REMOTE = true;

const storage: IntakeStorage = USE_REMOTE ? remoteIntakeStorage : localIntakeStorage;

export const saveIntakeDraft = async (data: IntakeFormData): Promise<void> => {
  const draft: IntakeFormDraft = {
    ...data,
    draftId: `draft-${data.appointmentId}`,
    savedAt: new Date().toISOString(),
  };
  await storage.saveDraft(draft);
};

export const loadIntakeDraft = async (
  appointmentId: string,
): Promise<IntakeFormDraft | null> => {
  return storage.loadDraft(appointmentId);
};

export const submitIntakeForm = async (
  data: IntakeFormData,
): Promise<IntakeFormSubmission> => {
  const submission: IntakeFormSubmission = {
    ...data,
    submissionId: `intake-${data.appointmentId}-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  await storage.saveSubmission(submission);
  await storage.deleteDraft(data.appointmentId);
  return submission;
};
