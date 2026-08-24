import { validateStep, isStepValid } from '../src/utils/intakeForm.validate';
import { IntakeFormData } from '../src/models/IntakeForm';

describe('intakeForm.validate', () => {
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

  describe('Step 0 - Symptoms', () => {
    it('invalid when no symptoms selected', () => {
      const errors = validateStep(0, data);
      expect(errors.symptoms).toBe('Select at least one symptom.');
      expect(isStepValid(0, data)).toBe(false);
    });

    it('valid with normal symptoms', () => {
      data.symptoms = ['vomiting'];
      expect(validateStep(0, data)).toEqual({});
      expect(isStepValid(0, data)).toBe(true);
    });

    it('invalid if other is selected but no text provided', () => {
      data.symptoms = ['other'];
      data.otherSymptom = '   ';
      const errors = validateStep(0, data);
      expect(errors.otherSymptom).toBe('Please describe the symptom.');
      expect(isStepValid(0, data)).toBe(false);
    });

    it('valid if other is selected and text provided', () => {
      data.symptoms = ['other'];
      data.otherSymptom = 'Limping';
      expect(isStepValid(0, data)).toBe(true);
    });
  });

  describe('Step 1 - Severity', () => {
    it('invalid when no severity selected', () => {
      expect(validateStep(1, data).severity).toBe('Please rate the severity.');
      expect(isStepValid(1, data)).toBe(false);
    });

    it('valid when severity selected', () => {
      data.severity = 'moderate';
      expect(isStepValid(1, data)).toBe(true);
    });
  });

  describe('Step 2 - Timeline', () => {
    it('invalid when duration or frequency missing', () => {
      expect(validateStep(2, data).duration).toBe('Please select a duration.');
      expect(validateStep(2, data).frequency).toBe('Please select a frequency.');
      expect(isStepValid(2, data)).toBe(false);

      data.duration = '1-3 days';
      expect(validateStep(2, data).frequency).toBe('Please select a frequency.');
      expect(isStepValid(2, data)).toBe(false);
    });

    it('valid when both selected', () => {
      data.duration = '1-3 days';
      data.frequency = 'constant';
      expect(isStepValid(2, data)).toBe(true);
    });
  });

  describe('Other Steps', () => {
    it('steps 3, 4, 5 are always valid', () => {
      expect(isStepValid(3, data)).toBe(true);
      expect(isStepValid(4, data)).toBe(true);
      expect(isStepValid(5, data)).toBe(true);
    });
  });
});
