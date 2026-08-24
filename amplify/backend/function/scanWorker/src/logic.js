/* eslint-env node */
'use strict';

const { aggregate, DEFAULT_DISCLAIMER } = require('./aggregate');

const SYSTEM_PROMPT = `You are PetVue's veterinary triage assistant. You analyze a single animal photograph (a dog, cat, or cow) submitted by a concerned owner. Your role is triage, not diagnosis.

CRITICAL RULES:
- DO NOT make definitive medical diagnoses.
- Base observations ONLY on visible evidence in the image.
- If the image is unclear, explicitly state uncertainty.
- Prioritize safety and caution in all recommendations.
- Never claim a definitive diagnosis. Always use "possible" or "signs of".
- If image quality is poor, set image_quality to "poor" and lower confidence accordingly.
- For EMERGENCY severity, include "Seek veterinary care immediately." in recommendation.
- If the subject is not clearly a dog, cat, or cow, return subject_detected: false and an empty findings array.
- Return ONLY a valid JSON object — no preamble, no markdown, no code fences.

For this image:
1. First, identify the species visible in the photograph. It must be one of: dog, cat, or cow. If it is not one of these, set subject_detected to false.
2. Identify visible symptoms appropriate for the detected species: skin lesions, eye abnormalities, parasites, fur/coat loss, visible ticks, swelling, discharge, posture anomalies, lameness, body condition.
3. Map symptoms to likely conditions, choosing from the list that matches the detected species:
   - Dog: [mange, tick fever, conjunctivitis, ringworm, hot spots, external parasites, cataracts, glaucoma, rabies indicators, healthy]
   - Cat: [feline conjunctivitis, ear mites, ringworm, flea infestation, feline acne, abscess, upper respiratory infection signs, dental disease signs, alopecia, healthy]
   - Cow: [mastitis signs, foot-and-mouth indicators, lumpy skin disease signs, pink eye (infectious bovine keratoconjunctivitis), ringworm, ectoparasites (ticks, lice), lameness, hoof lesions, body condition concerns, healthy]
4. Assign a confidence score (0-100) per condition.
5. Assign severity: HEALTHY / MONITOR / SEE_VET / EMERGENCY.

OUTPUT FORMAT:
{
  "subject_detected": true,
  "image_quality": "good" | "acceptable" | "poor",
  "description": string,
  "observed_concerns": [string],
  "reference_points": [string],
  "risk_level": "Low" | "Moderate" | "High",
  "risk_justification": string,
  "findings": [
    {
      "condition": string,
      "confidence": 0-100,
      "severity": "HEALTHY" | "MONITOR" | "SEE_VET" | "EMERGENCY",
      "visible_indicators": [string],
      "plain_language": string
    }
  ],
  "overall_status": "HEALTHY" | "NEEDS_ATTENTION" | "URGENT",
  "recommendation": string,
  "precautionary_steps": [string],
  "when_to_seek_vet": [string],
  "disclaimer": "This assessment is based solely on the provided image and may not be accurate. Please consult a qualified veterinarian for a professional diagnosis."
}

Field descriptions:
- "description": Objectively describe what is visible in the image (breed appearance, posture, coat condition, environment).
- "observed_concerns": Array of unusual signs observed (e.g., wounds, discoloration, posture issues, swelling). Empty array if none.
- "reference_points": Array of explanations for WHY each observed sign may indicate a potential issue. Empty array if no concerns.
- "risk_level": "Low" (no visible concerns), "Moderate" (some signs worth monitoring), "High" (urgent signs present).
- "risk_justification": Brief justification for the assigned risk level.
- "precautionary_steps": Array of safe, non-invasive actions the owner can take immediately BEFORE visiting a vet (e.g., "Keep the affected area clean and dry", "Prevent the pet from scratching or biting the area"). These should be practical home-care steps.
- "when_to_seek_vet": Array of conditions under which a vet visit is necessary (e.g., "If the swelling increases", "If the pet stops eating for more than 24 hours").
- "disclaimer": Always include the exact disclaimer text shown above.`;

const stripJsonFences = (text) => {
  if (!text) return '';
  const trimmed = text.trim();
  // Sometimes Claude wraps responses in ```json ... ``` despite instructions.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
};

const parseClaude = (text) => {
  const stripped = stripJsonFences(text);
  try {
    const parsed = JSON.parse(stripped);
    if (typeof parsed !== 'object' || parsed === null) return null;
    // Translate snake_case → the camelCase shape the aggregator expects.
    return {
      subjectDetected: parsed.subject_detected !== false,
      imageQuality: parsed.image_quality,
      findings: Array.isArray(parsed.findings) ? parsed.findings.map((f) => ({
        condition: f.condition,
        confidence: f.confidence,
        severity: f.severity,
        visibleIndicators: f.visible_indicators,
        plainLanguage: f.plain_language,
      })) : [],
      overallStatus: parsed.overall_status,
      recommendation: parsed.recommendation,
      description: parsed.description || '',
      observedConcerns: Array.isArray(parsed.observed_concerns) ? parsed.observed_concerns : [],
      referencePoints: Array.isArray(parsed.reference_points) ? parsed.reference_points : [],
      riskLevel: parsed.risk_level || '',
      riskJustification: parsed.risk_justification || '',
      precautionarySteps: Array.isArray(parsed.precautionary_steps) ? parsed.precautionary_steps : [],
      whenToSeekVet: Array.isArray(parsed.when_to_seek_vet) ? parsed.when_to_seek_vet : [],
    };
  } catch {
    return null;
  }
};

const callClaudeForImage = async ({ anthropic, modelId, base64, mediaType }) => {
  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: 'Analyze this animal photograph (the subject should be a dog, cat, or cow) for any visible health concerns and respond with the required JSON.' },
      ],
    }],
  });
  const text = response?.content?.[0]?.text || '';
  return parseClaude(text);
};

const handle = async (sqsEvent, deps) => {
  const records = sqsEvent?.Records || [];
  for (const record of records) {
    let parsedBody;
    try {
      parsedBody = JSON.parse(record.body || '{}');
    } catch {
      console.warn('[scanWorker] bad SQS body, skipping');
      continue;
    }
    const scanId = parsedBody.scanId;
    if (!scanId) continue;

    try {
      await processOne(scanId, deps);
    } catch (err) {
      console.error('[scanWorker] failed', scanId, err);
      await markFailed(scanId, err?.message || 'Worker failed', deps).catch((e) => {
        console.error('[scanWorker] also failed to mark failed', e);
      });
    }
  }
  return { processed: records.length };
};

const processOne = async (scanId, deps) => {
  const { env, getItem, updateItem, getObjectBytes, anthropic } = deps;
  const tableName = env.SCANS_TABLE;
  const bucket = env.SCAN_BUCKET;
  const modelId = env.MODEL_ID || 'claude-haiku-4-5';
  if (!tableName || !bucket) {
    throw new Error('Worker not fully configured (SCANS_TABLE / SCAN_BUCKET)');
  }

  const scan = await getItem({ tableName, key: { scanId } });
  if (!scan) throw new Error(`Scan ${scanId} not found`);
  if (!Array.isArray(scan.imageKeys) || scan.imageKeys.length === 0) {
    throw new Error('Scan has no image keys');
  }

  await updateItem({
    tableName,
    key: { scanId },
    set: { status: 'processing', updatedAt: new Date().toISOString() },
  });

  const mediaType = scan.mediaType || 'image/jpeg';
  const perImage = await Promise.all(
    scan.imageKeys.map(async (key) => {
      try {
        const bytes = await getObjectBytes({ bucket, key });
        const base64 = Buffer.from(bytes).toString('base64');
        return await callClaudeForImage({ anthropic, modelId, base64, mediaType });
      } catch (err) {
        console.warn('[scanWorker] image failed', key, err?.message);
        return null;
      }
    }),
  );

  const successes = perImage.filter((x) => x !== null);
  if (successes.length === 0) {
    throw new Error('All Claude calls failed; no findings to aggregate.');
  }

  const result = aggregate(successes);

  await updateItem({
    tableName,
    key: { scanId },
    set: {
      status: 'complete',
      result,
      finishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
};

const markFailed = async (scanId, message, deps) => {
  const { env, updateItem } = deps;
  await updateItem({
    tableName: env.SCANS_TABLE,
    key: { scanId },
    set: {
      status: 'failed',
      error: message,
      updatedAt: new Date().toISOString(),
    },
  });
};

module.exports = {
  handle,
  processOne,
  parseClaude,
  stripJsonFences,
  SYSTEM_PROMPT,
  DEFAULT_DISCLAIMER,
};
// Force deploy trigger
