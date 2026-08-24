jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('aws-amplify/api', () => ({
  post: jest.fn(),
}));
jest.mock('../src/aws-exports', () => ({}));

import { saveIntakeDraft, loadIntakeDraft, submitIntakeForm } from '../src/services/intakeService';
import { localIntakeStorage } from '../src/services/intakeStorage.local';
import { remoteIntakeStorage } from '../src/services/intakeStorage.remote';

jest.mock('../src/services/intakeStorage.local');
jest.mock('../src/services/intakeStorage.remote');

describe('intakeService', () => {
  const mockData = {
    petId: 'pet-1',
    petName: 'Bruno',
    appointmentId: 'mock-1',
    symptoms: ['vomiting'],
    otherSymptom: '',
    severity: 'moderate',
    duration: '1-3 days',
    frequency: 'intermittent',
    changes: [],
    notes: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveIntakeDraft calls saveDraft on the storage implementation', async () => {
    await saveIntakeDraft(mockData);
    // Since USE_REMOTE is true, but remote storage calls local for drafts:
    // the abstraction routes draft calls appropriately.
    // We expect local storage to be called eventually (if we spy on localIntakeStorage.saveDraft)
    // Actually wait, saveIntakeDraft delegates to `storage.saveDraft`
    // Since we exported remoteIntakeStorage and localIntakeStorage, let's verify remoteIntakeStorage.saveDraft is called
    expect(remoteIntakeStorage.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      ...mockData,
      draftId: 'draft-mock-1',
      savedAt: expect.any(String)
    }));
  });

  it('loadIntakeDraft calls loadDraft', async () => {
    (remoteIntakeStorage.loadDraft as jest.Mock).mockResolvedValueOnce(mockData);
    const result = await loadIntakeDraft('mock-1');
    expect(remoteIntakeStorage.loadDraft).toHaveBeenCalledWith('mock-1');
    expect(result).toEqual(mockData);
  });

  it('submitIntakeForm calls saveSubmission and deleteDraft', async () => {
    const result = await submitIntakeForm(mockData);
    
    expect(remoteIntakeStorage.saveSubmission).toHaveBeenCalledWith(expect.objectContaining({
      ...mockData,
      submissionId: expect.stringContaining('intake-mock-1'),
      submittedAt: expect.any(String)
    }));
    
    expect(remoteIntakeStorage.deleteDraft).toHaveBeenCalledWith('mock-1');
    expect(result.submissionId).toBeDefined();
  });
});
