/*
Use the following code to retrieve configured secrets from SSM:

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient();
const { Parameters } = await client.send(new GetParametersCommand({
  Names: ["ANTHROPIC_API_KEY"].map(secretName => process.env[secretName]),
  WithDecryption: true,
}));

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/* eslint-env node */
const Anthropic = require('@anthropic-ai/sdk');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const MODEL_ID = process.env.MODEL_ID || 'claude-haiku-4-5';

const ssm = new SSMClient();
let cachedApiKey = null;

async function resolveApiKey() {
  if (cachedApiKey) return cachedApiKey;
  const ref = process.env.ANTHROPIC_API_KEY;
  if (!ref) return null;
  // Amplify wires the env var to the SSM parameter path. Fetch the real value.
  if (ref.startsWith('/amplify/')) {
    const { Parameter } = await ssm.send(
      new GetParameterCommand({ Name: ref, WithDecryption: true }),
    );
    cachedApiKey = Parameter?.Value || null;
  } else {
    cachedApiKey = ref;
  }
  return cachedApiKey;
}

const SYSTEM_PROMPT = `You are PetVue's veterinary triage assistant. You analyze a single photograph of an animal (a dog, cat, or cow) and produce an owner-facing triage signal.

You are NOT a substitute for a licensed veterinarian. Your role is to surface visible cues so the owner knows whether to monitor, schedule a vet visit, or seek urgent care.

CRITICAL RULES:
- DO NOT make definitive medical diagnoses.
- Base observations ONLY on visible evidence in the image.
- If the image is unclear, explicitly state uncertainty.
- Prioritize safety and caution in all recommendations.
- First identify the species visible in the image. It must be one of: dog, cat, or cow. If it is not one of these, set status to "needs_attention", explain that the species is not supported, and recommend retaking with a clear photo of the dog, cat, or cow.
- Tailor observations to the detected species. Dog conditions (e.g., mange, tick fever, hot spots) differ from cat conditions (e.g., feline conjunctivitis, ear mites, upper respiratory signs) and from cow conditions (e.g., mastitis, foot-and-mouth indicators, pink eye, lameness).
- Respond ONLY with a single JSON object — no prose, no markdown, no code fences.

Use the following schema:
{
  "status": "healthy" | "needs_attention" | "urgent",
  "condition": string,
  "confidence": integer 0-100,
  "explanation": string,
  "recommendation": string,
  "description": string,
  "observed_concerns": [string],
  "reference_points": [string],
  "risk_level": "Low" | "Moderate" | "High",
  "risk_justification": string,
  "precautionary_steps": [string],
  "when_to_seek_vet": [string],
  "disclaimer": "This assessment is based solely on the provided image and may not be accurate. Please consult a qualified veterinarian for a professional diagnosis."
}

Field descriptions:
- "status": "healthy" (no visible concerns), "needs_attention" (schedule non-urgent vet visit), "urgent" (immediate veterinary care needed).
- "condition": short label, e.g. "Likely mild dermatitis", "No visible concerns".
- "confidence": 0-100, how confident you are in the assessment.
- "explanation": 2-3 owner-friendly sentences describing what you see.
- "recommendation": 1-2 sentences on what the owner should do next.
- "description": Objectively describe what is visible in the image (breed appearance, posture, coat condition, environment).
- "observed_concerns": Array of unusual signs observed (e.g., wounds, discoloration, posture issues, swelling). Empty array if none.
- "reference_points": Array of explanations for WHY each observed sign may indicate a potential issue. Empty array if no concerns.
- "risk_level": "Low" (no visible concerns), "Moderate" (some signs worth monitoring), "High" (urgent signs present).
- "risk_justification": Brief justification for the assigned risk level.
- "precautionary_steps": Array of safe, non-invasive actions the owner can take immediately BEFORE visiting a vet (e.g., "Keep the affected area clean and dry", "Prevent the pet from scratching or biting the area", "Monitor for changes in appetite or behavior"). These should be practical home-care steps.
- "when_to_seek_vet": Array of conditions under which a vet visit is necessary (e.g., "If the swelling increases", "If the pet stops eating for more than 24 hours").
- "disclaimer": Always include the exact disclaimer text shown above.

Keep language plain. Avoid jargon. Do NOT diagnose specific diseases — describe what is visible and use words like "appears" or "consistent with".`;

exports.handler = async event => {
  console.log('aiScan invoked', {
    httpMethod: event?.httpMethod,
    path: event?.path,
    modelId: MODEL_ID,
  });

  let apiKey;
  try {
    apiKey = await resolveApiKey();
  } catch (err) {
    console.error('aiScan: failed to resolve ANTHROPIC_API_KEY from SSM', {
      name: err?.name,
      message: err?.message,
    });
    return apiResponse(500, { error: 'Server is misconfigured (could not load API key).' });
  }

  if (!apiKey) {
    console.error('aiScan: ANTHROPIC_API_KEY is missing or empty');
    return apiResponse(500, { error: 'Server is misconfigured (missing API key).' });
  }

  const client = new Anthropic({ apiKey });

  try {
    const body = parseBody(event);
    const { imageBase64, mediaType = 'image/jpeg', notes = '' } = body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      console.warn('aiScan: missing imageBase64');
      return apiResponse(400, { error: 'imageBase64 is required' });
    }

    console.log('aiScan: invoking Anthropic', {
      mediaType,
      imageBytes: imageBase64.length,
      hasNotes: Boolean(notes),
    });

    const userText = notes
      ? `Analyze this animal photo (the subject should be a dog, cat, or cow) for visible health concerns. Owner notes: ${notes}`
      : 'Analyze this animal photo (the subject should be a dog, cat, or cow) for visible health concerns.';

    let message;
    try {
      message = await client.messages.create({
        model: MODEL_ID,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
              { type: 'text', text: userText },
            ],
          },
        ],
      });
    } catch (apiErr) {
      console.error('aiScan: Anthropic API call failed', {
        name: apiErr?.name,
        status: apiErr?.status,
        message: apiErr?.message,
        modelId: MODEL_ID,
      });
      if (apiErr instanceof Anthropic.AuthenticationError) {
        return apiResponse(502, { error: 'Invalid Anthropic API key.' });
      }
      if (apiErr instanceof Anthropic.RateLimitError) {
        return apiResponse(429, { error: 'Rate limited by Anthropic. Try again in a moment.' });
      }
      return apiResponse(502, {
        error: `Model invocation failed: ${apiErr?.message || apiErr?.name || 'unknown'}`,
      });
    }

    const textBlock = (message.content || []).find(b => b.type === 'text');
    const text = textBlock?.text || '';
    const parsed = extractJson(text);

    if (!parsed) {
      console.warn('aiScan: model returned unparseable response', { raw: text.slice(0, 500) });
      return apiResponse(502, { error: 'Model returned an unparseable response', raw: text });
    }

    const result = normalizeResult(parsed);
    console.log('aiScan: success', { status: result.status, confidence: result.confidence });
    return apiResponse(200, result);
  } catch (err) {
    console.error('aiScan: unhandled error', { name: err?.name, message: err?.message, stack: err?.stack });
    return apiResponse(500, { error: err?.message || 'Internal error' });
  }
};

function parseBody(event) {
  if (!event) return {};
  if (typeof event.body === 'string') {
    try { return JSON.parse(event.body); } catch (_) { return {}; }
  }
  return event.body || event;
}

function extractJson(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (_) {}
  const match = s.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) {}
  }
  return null;
}

function normalizeResult(obj) {
  const allowed = new Set(['healthy', 'needs_attention', 'urgent']);
  const status = allowed.has(obj.status) ? obj.status : 'needs_attention';
  const confidence = clampInt(obj.confidence, 0, 100, 50);
  const RISK_LEVELS = new Set(['Low', 'Moderate', 'High']);
  return {
    status,
    condition: stringOr(obj.condition, 'Unable to determine'),
    confidence,
    explanation: stringOr(obj.explanation, 'The model could not produce a clear assessment. Please try a clearer, well-lit photo.'),
    recommendation: stringOr(obj.recommendation, 'If you have any concerns, consult your veterinarian.'),
    description: stringOr(obj.description, ''),
    observed_concerns: Array.isArray(obj.observed_concerns) ? obj.observed_concerns.filter(s => typeof s === 'string') : [],
    reference_points: Array.isArray(obj.reference_points) ? obj.reference_points.filter(s => typeof s === 'string') : [],
    risk_level: RISK_LEVELS.has(obj.risk_level) ? obj.risk_level : (status === 'healthy' ? 'Low' : status === 'urgent' ? 'High' : 'Moderate'),
    risk_justification: stringOr(obj.risk_justification, ''),
    precautionary_steps: Array.isArray(obj.precautionary_steps) ? obj.precautionary_steps.filter(s => typeof s === 'string') : [],
    when_to_seek_vet: Array.isArray(obj.when_to_seek_vet) ? obj.when_to_seek_vet.filter(s => typeof s === 'string') : [],
    disclaimer: stringOr(obj.disclaimer, 'This assessment is based solely on the provided image and may not be accurate. Please consult a qualified veterinarian for a professional diagnosis.'),
  };
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function stringOr(v, fallback) {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function apiResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify(body),
  };
}
// Force deploy trigger
