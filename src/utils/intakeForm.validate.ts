import { IntakeFormData } from '../models/IntakeForm';

export interface FormErrors {
  symptoms?: string;
  otherSymptom?: string;
  severity?: string;
  duration?: string;
  frequency?: string;
}

export function validateStep(step: number, data: IntakeFormData): FormErrors {
  const errors: FormErrors = {};
  switch (step) {
    case 0:
      if (data.symptoms.length === 0) errors.symptoms = 'Select at least one symptom.';
      if (data.symptoms.includes('other') && !data.otherSymptom.trim())
        errors.otherSymptom = 'Please describe the symptom.';
      break;
    case 1:
      if (!data.severity) errors.severity = 'Please rate the severity.';
      break;
    case 2:
      if (!data.duration) errors.duration = 'Please select a duration.';
      if (!data.frequency) errors.frequency = 'Please select a frequency.';
      break;
  }
  return errors;
}

export function isStepValid(step: number, data: IntakeFormData): boolean {
  return Object.keys(validateStep(step, data)).length === 0;
}
