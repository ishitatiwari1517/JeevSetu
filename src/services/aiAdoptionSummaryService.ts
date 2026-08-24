// ─── AI Adoption Summary Service ──────────────────────────────────────────────
// Generates adoption summaries using the existing /scan Lambda endpoint.
// If the Lambda doesn't yet support adoption_summary payloads, the service
// falls back to a rich, locally-generated template-based summary so the feature
// works end-to-end without any backend changes.

import { post } from 'aws-amplify/api';
import awsExports from '../aws-exports';
import { SCAN_API_NAME, SCAN_API_PATH, SCAN_ENDPOINT_OVERRIDE } from '../config/scanApi';
import { getAnimal, updateAnimal } from './animalService';
import { listMedicalRecords } from './medicalRecordService';
import { getOrganization } from './orgService';
import { Animal } from '../models/Animal';
import { MedicalRecord } from '../models/MedicalRecord';

// ── API resolution (identical to aiScan.js) ───────────────────────────────────

function resolveApiName(): string {
  const apis: any[] = awsExports?.aws_cloud_logic_custom || [];
  if (apis.some((a: any) => a.name === SCAN_API_NAME)) return SCAN_API_NAME;
  return apis[0]?.name || SCAN_API_NAME;
}

function getApiBase(): string | null {
  const apis: any[] = awsExports?.aws_cloud_logic_custom || [];
  const name = resolveApiName();
  const api = apis.find((a: any) => a.name === name) || apis[0];
  if (!api?.endpoint) return null;
  return api.endpoint.replace(/\/$/, '');
}

// Use the same /scan path — no new Lambda routes needed.
const effectivePath = SCAN_API_PATH.startsWith('/') ? SCAN_API_PATH : `/${SCAN_API_PATH}`;

export class SummaryError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SummaryError';
    this.code = code;
  }
}

// ── Amplify post ──────────────────────────────────────────────────────────────

async function postWithAmplify(payload: object): Promise<any> {
  const op = post({
    apiName: resolveApiName(),
    path: effectivePath,
    options: { body: payload as any, headers: { 'Content-Type': 'application/json' } },
  });
  const { body } = await op.response;
  return await body.json();
}

// ── Direct fetch fallback ─────────────────────────────────────────────────────

async function postWithFetch(payload: object): Promise<any> {
  const url = SCAN_ENDPOINT_OVERRIDE ||
    (() => { const b = getApiBase(); return b ? `${b}${effectivePath}` : null; })();

  if (!url) throw new SummaryError('API endpoint not configured.', 'API_NOT_CONFIGURED');

  const res = await fetch(url as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!res.ok) throw new SummaryError(data?.error || data?.message || `Request failed (${res.status}).`, 'HTTP_ERROR');
  return data;
}

// ── Try remote AI, fall back to local template ────────────────────────────────

const AUTH_FAILURE_PATTERN = /missing authentication|forbidden|unauthorized|not authorized|signature|403|401|does not exist/i;

async function tryRemoteSummary(prompt: string): Promise<string | null> {
  const payload = { type: 'adoption_summary', prompt };

  try {
    let data: any;
    try {
      data = await postWithAmplify(payload);
    } catch (err: any) {
      const base = getApiBase();
      if (!base) return null; // No backend configured — use local template
      console.warn('[aiAdoptionSummary] Amplify failed, trying fetch fallback:', err?.message);
      data = await postWithFetch(payload);
    }

    const text: string = data?.summary || data?.text || data?.result || '';
    return text.trim() || null;
  } catch (err: any) {
    // Remote AI unavailable for any reason — use local template silently
    console.warn('[aiAdoptionSummary] Remote AI unavailable, using local template:', err?.message);
    return null;
  }
}

// ── Local template-based summary (offline / no backend required) ──────────────

const cap = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';

function buildLocalSummary(animal: any, records: MedicalRecord[]): string {
  const name = animal.name || 'This wonderful animal';
  const species = cap(animal.species) || 'Animal';
  const breed = animal.breed ? `${animal.breed} ` : '';
  const gender = animal.gender === 'male' ? 'he' : animal.gender === 'female' ? 'she' : 'they';
  const genderCap = gender.charAt(0).toUpperCase() + gender.slice(1);

  // Paragraph 1 — Who they are
  const ageStr = animal.estimatedAge ? `, approximately ${animal.estimatedAge} old` : '';
  const intakeStr = animal.intakeDate
    ? ` rescued on ${new Date(animal.intakeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : '';
  const para1 = `${name} is a ${breed}${species.toLowerCase()}${ageStr}${intakeStr}. ` +
    `${genderCap} came into our shelter's care ${animal.intakeSource ? `from ${cap(animal.intakeSource).toLowerCase()}` : 'after being rescued'} ` +
    `and has since settled in beautifully under the care of our dedicated team.`;

  // Paragraph 2 — Health & care
  const vacStr = animal.isVaccinated ? 'fully vaccinated' : '';
  const neuStr = animal.isNeutered ? (animal.gender === 'female' ? 'spayed' : 'neutered') : '';
  const healthPoints = [vacStr, neuStr].filter(Boolean);
  const activeMeds: string[] = [];
  const today = new Date();
  for (const r of records) {
    for (const med of (r as any).medications || []) {
      if (!med.endDate || new Date(med.endDate) > today) activeMeds.push(med.name);
    }
  }

  let para2 = `${name} is in ${cap(animal.healthStatus) || 'good'} health`;
  if (healthPoints.length > 0) para2 += ` and is ${healthPoints.join(' and ')}`;
  para2 += '.';
  if (activeMeds.length > 0) {
    para2 += ` ${genderCap} is currently on ${activeMeds.join(', ')} and will require continued care in this regard.`;
  }
  if (animal.specialNeeds) {
    para2 += ` Please note: ${animal.specialNeeds}.`;
  }

  // Paragraph 3 — Personality & behaviour
  const behaviour = animal.behaviourNotes || animal.temperament;
  let para3 = '';
  if (behaviour) {
    para3 = `${name}'s personality shines through every day — ${behaviour.charAt(0).toLowerCase()}${behaviour.slice(1)}`;
    if (!para3.endsWith('.')) para3 += '.';
  } else {
    const compatParts: string[] = [];
    if (animal.isGoodWithKids === true)  compatParts.push('children');
    if (animal.isGoodWithDogs === true)  compatParts.push('other dogs');
    if (animal.isGoodWithCats === true)  compatParts.push('cats');
    para3 = compatParts.length > 0
      ? `${name} gets along wonderfully with ${compatParts.join(', ')} and would thrive in a loving home.`
      : `${name} has a gentle, curious nature and is settling in well at the shelter.`;
  }

  // Paragraph 4 — CTA
  const para4 = `If you are looking for a loyal companion to join your family, ${name} might just be the one. ` +
    `Come meet ${gender} at our shelter — ${gender} can't wait to find a forever home!`;

  return [para1, para2, para3, para4].filter(Boolean).join('\n\n');
}

// ── Context builder for remote AI prompt ─────────────────────────────────────

function buildPrompt(animal: any, records: MedicalRecord[]): string {
  const boolVal = (v?: boolean) => v === true ? 'Yes' : v === false ? 'No' : 'Not assessed';

  const activeMeds: string[] = [];
  const today = new Date();
  for (const r of records) {
    for (const med of (r as any).medications || []) {
      if (!med.endDate || new Date(med.endDate) > today) activeMeds.push(med.name);
    }
  }

  return `You are a compassionate shelter coordinator writing adoption profiles for rescued animals.
Write a warm, honest, and professional adoption summary.

RULES:
- Use ONLY the facts provided. Do NOT invent details.
- Tone: warm, hopeful, empathetic — not over-sentimental.
- Length: 3-4 short paragraphs of 2-3 sentences each.
- Write in third person.
- Omit any field marked "Unknown" or "Not assessed".
- End with a warm call to action.
- Return ONLY the summary text. No headers or labels.

ANIMAL DATA:
Name: ${animal.name || 'Unnamed'}
Species: ${cap(animal.species)}
Breed: ${animal.breed || 'Unknown'}
Estimated Age: ${animal.estimatedAge || 'Unknown'}
Gender: ${cap(animal.gender)}
Weight: ${animal.weightKg ? `${animal.weightKg} kg` : 'Unknown'}
Current health status: ${cap(animal.healthStatus)}
Vaccinated: ${animal.isVaccinated ? 'Yes' : 'Unknown'}
Neutered/Spayed: ${animal.isNeutered ? 'Yes' : 'Unknown'}
Current medications: ${activeMeds.join(', ') || 'None'}
Behaviour notes: ${animal.behaviourNotes || animal.temperament || 'Not assessed'}
Good with children: ${boolVal(animal.isGoodWithKids)}
Good with other dogs: ${boolVal(animal.isGoodWithDogs)}
Good with cats: ${boolVal(animal.isGoodWithCats)}
Special care needs: ${animal.specialNeeds || 'None noted'}

Write the adoption summary now:`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates an adoption summary: tries remote AI first, falls back to local template.
 * Always saves the result as a 'draft' so staff can review before publishing.
 */
export const generateAdoptionSummary = async (animalId: string): Promise<Animal> => {
  const org = await getOrganization();
  const orgId = (org as any)?.id || 'default';

  const [animal, records] = await Promise.all([
    getAnimal(animalId),
    listMedicalRecords(orgId, animalId),
  ]);

  if (!animal) throw new SummaryError(`Animal ${animalId} not found.`, 'NOT_FOUND');

  const prompt = buildPrompt(animal, records);

  // Try remote AI; if unavailable, use local template
  let summary = await tryRemoteSummary(prompt);
  if (!summary) {
    summary = buildLocalSummary(animal, records);
  }

  return updateAnimal(animalId, {
    aiAdoptionSummary: summary,
    aiSummaryGeneratedAt: new Date().toISOString(),
    aiSummaryStatus: 'draft',
  });
};

/**
 * Publishes the current draft summary after staff review/edit.
 */
export const publishAdoptionSummary = async (
  animalId: string,
  editedText: string,
): Promise<Animal> => {
  return updateAnimal(animalId, {
    aiAdoptionSummary: editedText.trim(),
    aiSummaryStatus: 'published',
  });
};

/**
 * Resets/unpublishes the summary.
 */
export const unpublishAdoptionSummary = async (animalId: string): Promise<Animal> => {
  return updateAnimal(animalId, {
    aiAdoptionSummary: undefined,
    aiSummaryGeneratedAt: undefined,
    aiSummaryStatus: 'none',
  });
};
