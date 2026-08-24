import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '../aws-exports';
import {
  SCAN_API_NAME, SCAN_API_PATH, SCAN_ENDPOINT_OVERRIDE,
  USE_NEW_PIPELINE, SCAN_INITIATE_PATH, SCAN_PROCESS_PATH, SCAN_RESULT_PATH,
  SCAN_POLL_INTERVAL_MS, SCAN_POLL_TIMEOUT_MS,
} from '../config/scanApi';
import { DEFAULT_DISCLAIMER } from './scanResult';

// Amplify writes the REST API into aws-exports.js under the auto-generated API ID
// rather than the friendly name configured in amplify/backend, so resolve the
// effective name at runtime: prefer the configured SCAN_API_NAME if it matches an
// entry, otherwise fall back to the first custom API (there is only one).
function resolveApiName() {
  const apis = awsExports?.aws_cloud_logic_custom || [];
  if (apis.some(a => a.name === SCAN_API_NAME)) return SCAN_API_NAME;
  return apis[0]?.name || SCAN_API_NAME;
}

const LEGACY_STATUSES = new Set(['healthy', 'needs_attention', 'urgent']);
const OVERALL_STATUSES = new Set(['HEALTHY', 'NEEDS_ATTENTION', 'URGENT']);
const SEVERITIES = new Set(['HEALTHY', 'MONITOR', 'SEE_VET', 'EMERGENCY']);
const IMAGE_QUALITIES = new Set(['good', 'acceptable', 'poor']);

const LEGACY_TO_OVERALL = {
  healthy: 'HEALTHY',
  needs_attention: 'NEEDS_ATTENTION',
  urgent: 'URGENT',
};

const LEGACY_TO_SEVERITY = {
  healthy: 'HEALTHY',
  needs_attention: 'SEE_VET',
  urgent: 'EMERGENCY',
};

const AUTH_FAILURE_PATTERN =
  /missing authentication|forbidden|unauthorized|not authorized|signature|403|401/i;

export class ScanError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ScanError';
    this.code = code;
  }
}

export async function runAiScan({ imageBase64, mediaType = 'image/jpeg', notes = '' }) {
  if (!imageBase64) {
    throw new ScanError('No image to scan.', 'NO_IMAGE');
  }

  // Anthropic only accepts: image/jpeg, image/png, image/gif, image/webp.
  // react-native-image-picker sometimes returns 'image/jpg' (non-standard).
  const VALID_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  let safeMediaType = (mediaType || '').toLowerCase().trim();
  if (safeMediaType === 'image/jpg') safeMediaType = 'image/jpeg';
  if (!VALID_TYPES.has(safeMediaType)) safeMediaType = 'image/jpeg';

  const payload = { imageBase64, mediaType: safeMediaType, notes };

  if (SCAN_ENDPOINT_OVERRIDE) {
    const raw = await postWithFetch(SCAN_ENDPOINT_OVERRIDE, payload);
    return normalize(raw);
  }

  let raw;
  try {
    raw = await postWithAmplify(payload);
  } catch (err) {
    // The /scan path is configured as "open" (no auth) on API Gateway, but Amplify
    // sometimes still attempts SigV4 signing or the session can be stale, which
    // results in a 403 "Missing Authentication Token". Fall back to a direct
    // fetch using the endpoint published in aws-exports.js.
    const fallbackUrl = getEndpointFromConfig();
    const isAuthFailure = AUTH_FAILURE_PATTERN.test(err?.message || '');
    const isConfigError = err?.code === 'API_NOT_CONFIGURED';
    
    // Fall back to direct fetch for ANY error if we have a fallback URL.
    // Amplify v6's post() is opaque and often returns "Unknown error" for 
    // server-side failures (like Lambda errors) that fetch handles fine.
    if (!fallbackUrl) throw err;

    console.warn(
      `[aiScan] Amplify post failed (${isAuthFailure ? 'Auth' : 'General'}):`, 
      err?.message
    );
    raw = await postWithFetch(fallbackUrl, payload);
  }

  return normalize(raw);
}

function getApiBase() {
  const apis = awsExports?.aws_cloud_logic_custom || [];
  const name = resolveApiName();
  const api = apis.find(a => a.name === name) || apis[0];
  if (!api?.endpoint) return null;
  return api.endpoint.replace(/\/$/, '');
}

function getEndpointFromConfig() {
  const base = getApiBase();
  if (!base) return null;
  const path = SCAN_API_PATH.startsWith('/') ? SCAN_API_PATH : `/${SCAN_API_PATH}`;
  return `${base}${path}`;
}

async function postWithAmplify(payload) {
  try {
    const path = SCAN_API_PATH.startsWith('/') ? SCAN_API_PATH : `/${SCAN_API_PATH}`;
    const op = post({
      apiName: resolveApiName(),
      path,
      options: { body: payload, headers: { 'Content-Type': 'application/json' } },
    });
    const { body } = await op.response;
    return await body.json();
  } catch (err) {
    if (err?.message?.includes('No api configured')) {
      throw new ScanError(
        'Scan service is not configured. Run `amplify push` to deploy the petvueapi REST endpoint, or set SCAN_ENDPOINT_OVERRIDE in src/config/scanApi.js.',
        'API_NOT_CONFIGURED',
      );
    }
    throw new ScanError(err?.message || 'Scan request failed.', 'REQUEST_FAILED');
  }
}

async function postWithFetch(url, payload) {
  console.log('[aiScan] POST', url);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    throw new ScanError(
      networkErr?.message || 'Network request failed. Check your connection and try again.',
      'NETWORK_ERROR',
    );
  }

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { error: text }; }

  if (!res.ok) {
    console.warn('[aiScan] error response', res.status, text);
    const message =
      data?.error ||
      data?.message ||
      (res.status === 403
        ? 'Scan endpoint rejected the request (403). Check API Gateway deployment and CORS.'
        : `Scan failed (${res.status}).`);
    throw new ScanError(message, 'HTTP_ERROR');
  }
  return data;
}

/**
 * Multi-image scan dispatcher. Branches on the USE_NEW_PIPELINE flag:
 * - true:  presigned upload + async worker + polling (Phase 2 #6/#7).
 * - false: legacy single-image base64 path (best image submitted to old lambda).
 *
 * The contract is identical in both branches — same call signature, same
 * ScanResult shape returned. ScanProcessingScreen / ScanResultScreen don't
 * know which path ran.
 */
export async function runMultiImageScan(assets, opts = {}) {
  if (!assets || assets.length === 0) {
    throw new ScanError('Add at least one photo before running the scan.', 'NO_IMAGES');
  }
  if (USE_NEW_PIPELINE) {
    return runNewPipelineScan(assets, opts);
  }
  return runLegacySingleImageScan(assets, opts);
}

async function runLegacySingleImageScan(assets, { notes = '' } = {}) {
  const primary =
    assets.find(a => a.quality !== 'poor' && a.base64) ||
    assets.find(a => a.base64) ||
    assets[0];
  if (!primary?.base64) {
    throw new ScanError('Selected images are missing data; please re-pick.', 'NO_IMAGE');
  }
  return runAiScan({
    imageBase64: primary.base64,
    mediaType: primary.mediaType || 'image/jpeg',
    notes,
  });
}

// ---- New pipeline (Phase 2 #6/#7) ------------------------------------------

async function authHeaders() {
  let session;
  try {
    session = await fetchAuthSession();
  } catch (err) {
    throw new ScanError(
      err?.message || 'Authentication required to run a scan.',
      'NO_AUTH',
    );
  }
  const jwt = session?.tokens?.idToken?.toString();
  if (!jwt) {
    throw new ScanError('Authentication required to run a scan.', 'NO_AUTH');
  }
  return { Authorization: jwt, 'Content-Type': 'application/json' };
}

async function jsonRequest(method, url, headers, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    throw new ScanError(
      err?.message || 'Network request failed. Check your connection and try again.',
      'NETWORK_ERROR',
    );
  }
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { error: text }; }
  if (!res.ok) {
    const message =
      parsed?.error || parsed?.message || `Scan request failed (${res.status}).`;
    throw new ScanError(message, parsed?.code || 'HTTP_ERROR');
  }
  return parsed;
}

async function uploadAssetToPresigned(asset, presignedUrl) {
  const blob = await fetch(asset.uri).then(r => r.blob()).catch(err => {
    throw new ScanError(
      `Could not read image from device: ${err?.message}`,
      'LOCAL_READ_FAILED',
    );
  });
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': asset.mediaType || 'image/jpeg' },
    body: blob,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ScanError(`Image upload failed (${res.status}). ${text}`.trim(), 'UPLOAD_FAILED');
  }
}

/**
 * Pure: extract scanId + presigned URLs from initiate response, in order.
 */
export function parseInitiateResponse(raw) {
  const scanId = typeof raw?.scanId === 'string' ? raw.scanId : null;
  const presigned = Array.isArray(raw?.presigned) ? raw.presigned : [];
  if (!scanId) throw new ScanError('Initiate response missing scanId.', 'BAD_INITIATE');
  if (presigned.length === 0) throw new ScanError('Initiate response missing presigned URLs.', 'BAD_INITIATE');
  return { scanId, presigned };
}

/**
 * Pure: classify a /scan/{id}/result response. Returns either a
 * { done: true, result } object, a { done: false } when still pending, or
 * throws ScanError on terminal failure.
 */
export function classifyResultResponse(body) {
  const status = body?.status;
  if (status === 'complete') {
    if (!body?.result) throw new ScanError('Server returned complete with no result.', 'BAD_RESULT');
    return { done: true, result: body.result };
  }
  if (status === 'failed') {
    throw new ScanError(body?.error || 'Scan worker failed.', 'WORKER_FAILED');
  }
  return { done: false };
}

/**
 * Polls /scan/{id}/result until status is complete or failed. fetcher / sleep
 * are injectable for tests.
 */
export async function pollScanResult(scanId, baseUrl, headers, opts = {}) {
  const intervalMs = opts.intervalMs ?? SCAN_POLL_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? SCAN_POLL_TIMEOUT_MS;
  const fetcher = opts.fetcher || (() =>
    jsonRequest('GET', `${baseUrl}${SCAN_RESULT_PATH(scanId)}`, headers));
  const sleep = opts.sleep || (ms => new Promise(r => setTimeout(r, ms)));
  const now = opts.now || (() => Date.now());

  const start = now();
  // First call before any sleep so a fast worker doesn't pay a wait.
  for (;;) {
    const body = await fetcher();
    const verdict = classifyResultResponse(body);
    if (verdict.done) return verdict.result;
    if (now() - start >= timeoutMs) {
      throw new ScanError('Scan timed out waiting for the worker.', 'TIMEOUT');
    }
    await sleep(intervalMs);
  }
}

async function runNewPipelineScan(assets, opts = {}) {
  const baseUrl = getApiBase();
  if (!baseUrl) {
    throw new ScanError(
      'Scan service is not configured. Run `amplify push` per docs/backend/scan-pipeline.md.',
      'API_NOT_CONFIGURED',
    );
  }

  const headers = await authHeaders();

  const initiateBody = {
    imageCount: assets.length,
    mediaType: assets[0]?.mediaType || 'image/jpeg',
  };
  if (opts.petId) initiateBody.petId = opts.petId;

  const initiateRaw = await jsonRequest(
    'POST', `${baseUrl}${SCAN_INITIATE_PATH}`, headers, initiateBody,
  );
  const { scanId, presigned } = parseInitiateResponse(initiateRaw);

  if (presigned.length !== assets.length) {
    throw new ScanError(
      `Server issued ${presigned.length} upload URLs for ${assets.length} images.`,
      'COUNT_MISMATCH',
    );
  }

  await Promise.all(
    assets.map((asset, i) => uploadAssetToPresigned(asset, presigned[i].uploadUrl)),
  );

  await jsonRequest(
    'POST', `${baseUrl}${SCAN_PROCESS_PATH(scanId)}`, headers, {},
  );

  return pollScanResult(scanId, baseUrl, headers);
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new ScanError('Scan returned an unexpected response.', 'BAD_RESPONSE');
  }
  // Phase 2 #7 lambda returns the multi-finding shape directly.
  if (Array.isArray(raw.findings)) {
    return normalizeMultiFinding(raw);
  }
  // Today's lambda is single-finding; synthesize the new shape.
  return normalizeLegacy(raw);
}

function normalizeMultiFinding(raw) {
  const overallStatus = OVERALL_STATUSES.has(raw.overall_status) ? raw.overall_status : 'NEEDS_ATTENTION';
  const imageQuality = IMAGE_QUALITIES.has(raw.image_quality) ? raw.image_quality : 'acceptable';
  const findings = raw.findings.map(f => ({
    condition: stringOr(f.condition, 'Unable to determine'),
    confidence: clampInt(f.confidence, 0, 100, 50),
    severity: SEVERITIES.has(f.severity) ? f.severity : 'MONITOR',
    visibleIndicators: Array.isArray(f.visible_indicators) ? f.visible_indicators.filter(s => typeof s === 'string') : [],
    plainLanguage: stringOr(f.plain_language, ''),
  }));
  return {
    subjectDetected: raw.subject_detected !== false,
    imageQuality,
    findings,
    overallStatus,
    recommendation: stringOr(raw.recommendation, 'If you have any concerns, consult your veterinarian.'),
    disclaimer: stringOr(raw.disclaimer, DEFAULT_DISCLAIMER),
    description: stringOr(raw.description, ''),
    observedConcerns: Array.isArray(raw.observed_concerns) ? raw.observed_concerns.filter(s => typeof s === 'string') : (Array.isArray(raw.observedConcerns) ? raw.observedConcerns.filter(s => typeof s === 'string') : []),
    referencePoints: Array.isArray(raw.reference_points) ? raw.reference_points.filter(s => typeof s === 'string') : (Array.isArray(raw.referencePoints) ? raw.referencePoints.filter(s => typeof s === 'string') : []),
    riskLevel: raw.risk_level || raw.riskLevel || '',
    riskJustification: stringOr(raw.risk_justification || raw.riskJustification, ''),
    precautionarySteps: Array.isArray(raw.precautionary_steps) ? raw.precautionary_steps.filter(s => typeof s === 'string') : (Array.isArray(raw.precautionarySteps) ? raw.precautionarySteps.filter(s => typeof s === 'string') : []),
    whenToSeekVet: Array.isArray(raw.when_to_seek_vet) ? raw.when_to_seek_vet.filter(s => typeof s === 'string') : (Array.isArray(raw.whenToSeekVet) ? raw.whenToSeekVet.filter(s => typeof s === 'string') : []),
  };
}

function normalizeLegacy(raw) {
  const legacyStatus = LEGACY_STATUSES.has(raw.status) ? raw.status : 'needs_attention';
  const overallStatus = LEGACY_TO_OVERALL[legacyStatus];
  const confidence = clampInt(raw.confidence, 0, 100, 50);
  const condition = stringOr(raw.condition, 'Unable to determine');
  const explanation = stringOr(
    raw.explanation,
    'The model could not produce a clear assessment. Please try a clearer, well-lit photo.',
  );
  const findings = legacyStatus === 'healthy' ? [] : [{
    condition,
    confidence,
    severity: LEGACY_TO_SEVERITY[legacyStatus],
    visibleIndicators: [],
    plainLanguage: explanation,
  }];
  return {
    subjectDetected: true,
    imageQuality: 'acceptable',
    findings,
    overallStatus,
    recommendation: stringOr(raw.recommendation, 'If you have any concerns, consult your veterinarian.'),
    disclaimer: DEFAULT_DISCLAIMER,
    description: stringOr(raw.description, ''),
    observedConcerns: Array.isArray(raw.observed_concerns) ? raw.observed_concerns.filter(s => typeof s === 'string') : [],
    referencePoints: Array.isArray(raw.reference_points) ? raw.reference_points.filter(s => typeof s === 'string') : [],
    riskLevel: raw.risk_level || (legacyStatus === 'healthy' ? 'Low' : legacyStatus === 'urgent' ? 'High' : 'Moderate'),
    riskJustification: stringOr(raw.risk_justification, ''),
    precautionarySteps: Array.isArray(raw.precautionary_steps) ? raw.precautionary_steps.filter(s => typeof s === 'string') : [],
    whenToSeekVet: Array.isArray(raw.when_to_seek_vet) ? raw.when_to_seek_vet.filter(s => typeof s === 'string') : [],
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
