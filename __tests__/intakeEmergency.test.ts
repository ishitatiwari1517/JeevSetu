import { detectEmergency } from '../src/utils/emergencyDetect';
import { IntakeFormData } from '../src/models/IntakeForm';

describe('emergencyDetect', () => {
  let data: IntakeFormData;

  beforeEach(() => {
    data = {
      petId: 'pet-1',
      petName: 'Bruno',
      appointmentId: 'mock-1',
      symptoms: [],
      otherSymptom: '',
      severity: '',
      duration: '',
      frequency: '',
      changes: [],
      notes: '',
    };
  });

  it('returns false when no severity is set', () => {
    expect(detectEmergency(data)).toBe(false);
  });

  it('returns true when severity is severe', () => {
    data.severity = 'severe';
    expect(detectEmergency(data)).toBe(true);
  });

  it('returns true when moderate severity with vomiting and lethargy', () => {
    data.severity = 'moderate';
    data.symptoms = ['vomiting', 'lethargy'];
    expect(detectEmergency(data)).toBe(true);
  });

  it('returns false when moderate severity with only vomiting', () => {
    data.severity = 'moderate';
    data.symptoms = ['vomiting'];
    expect(detectEmergency(data)).toBe(false);
  });

  it('returns false when mild severity even with vomiting and lethargy', () => {
    data.severity = 'mild';
    data.symptoms = ['vomiting', 'lethargy'];
    expect(detectEmergency(data)).toBe(false);
  });
});
