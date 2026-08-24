import { IntakeFormData } from '../models/IntakeForm';

export function detectEmergency(data: IntakeFormData): boolean {
  if (!data.severity) return false;
  if (data.severity === 'severe') return true;
  const hasConcerningPair =
    data.symptoms.includes('vomiting') && data.symptoms.includes('lethargy');
  return hasConcerningPair && data.severity === 'moderate';
}
