import AsyncStorage from '@react-native-async-storage/async-storage';
import { IntakeFormDraft, IntakeFormSubmission } from '../models/IntakeForm';
import { IntakeStorage } from './intakeStorage';

const DRAFT_PREFIX = '@intake_draft_';
const SUBMISSIONS_KEY = '@intake_submissions';

export const localIntakeStorage: IntakeStorage = {
  async saveDraft(draft) {
    await AsyncStorage.setItem(`${DRAFT_PREFIX}${draft.appointmentId}`, JSON.stringify(draft));
  },

  async loadDraft(appointmentId) {
    const raw = await AsyncStorage.getItem(`${DRAFT_PREFIX}${appointmentId}`);
    return raw ? (JSON.parse(raw) as IntakeFormDraft) : null;
  },

  async deleteDraft(appointmentId) {
    await AsyncStorage.removeItem(`${DRAFT_PREFIX}${appointmentId}`);
  },

  async saveSubmission(submission) {
    const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
    const list: IntakeFormSubmission[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(s => s.submissionId === submission.submissionId);
    if (idx >= 0) {
      list[idx] = submission;
    } else {
      list.push(submission);
    }
    await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
  },

  async listSubmissions() {
    const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
    return raw ? (JSON.parse(raw) as IntakeFormSubmission[]) : [];
  },
};
