// ─── QR Code & Public Profile Service ────────────────────────────────────────
// Generates public profile URLs and shareable content for each animal.
// The QR code itself is rendered by react-native-qrcode-svg in the UI layer.
// This service is pure logic — no native APIs, fully testable.

import { Animal } from '../models/Animal';
import { Organization } from '../models/Organization';
import { updateAnimal } from './animalService';

// ── Constants ─────────────────────────────────────────────────────────────────

const PUBLIC_BASE_URL = 'https://petvue.app/p';

// ── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Canonical public profile URL for an animal.
 * The QR code encodes this URL — it must be stable forever.
 * Uses animal.id (not caseId) so it survives case ID changes.
 */
export const getPublicProfileUrl = (animalId: string): string =>
  `${PUBLIC_BASE_URL}/${animalId}`;

/**
 * Human-readable slug shown below the QR code.
 * We show the caseId (e.g. "PV-2024-0391") as a friendly label —
 * but the actual URL still uses the internal id.
 */
export const getProfileSlug = (animal: Animal): string =>
  animal.publicProfileSlug || animal.caseId || animal.id;

// ── Share helpers ─────────────────────────────────────────────────────────────

const capitalize = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';

/**
 * Builds a shareable text message for share sheets, WhatsApp, etc.
 */
export const getShareMessage = (animal: Animal, org?: Organization | null): string => {
  const name    = animal.name || 'Our rescue animal';
  const species = capitalize(animal.species);
  const breed   = animal.breed ? `${animal.breed} · ` : '';
  const shelter = org?.name || 'Animal Shelter';
  const url     = getPublicProfileUrl(animal.id);

  return (
    `🐾 Meet ${name}!\n` +
    `${breed}${species}\n\n` +
    `View full profile & apply to adopt:\n` +
    `${url}\n\n` +
    `— ${shelter}`
  );
};

/**
 * HTML template for printing a QR code sheet for a kennel or adoption event.
 * Designed to fill an A4 / letter page with clean, printable layout.
 */
export const getPrintHtml = (
  animal: Animal,
  org?: Organization | null,
  qrSvgDataUri?: string,
): string => {
  const name    = animal.name || 'Unnamed';
  const caseId  = animal.caseId || animal.id;
  const species = capitalize(animal.species);
  const breed   = animal.breed || '';
  const shelter = org?.name || 'Animal Shelter';
  const phone   = org?.contactPhone || '';
  const url     = getPublicProfileUrl(animal.id);
  const date    = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const qrSection = qrSvgDataUri
    ? `<img src="${qrSvgDataUri}" width="220" height="220" style="display:block;margin:0 auto;" />`
    : `<div style="width:220px;height:220px;border:2px dashed #ccc;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;">QR Code</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 40px; color: #1a202c; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #2b7a9e; padding-bottom: 20px; }
    .shelter-name { font-size: 22px; font-weight: 800; color: #2b7a9e; }
    .powered { font-size: 11px; color: #a0aec0; margin-top: 4px; }
    .animal-name { font-size: 36px; font-weight: 800; margin: 24px 0 4px; text-align: center; }
    .animal-sub { font-size: 16px; color: #718096; text-align: center; margin-bottom: 8px; }
    .case-id { font-size: 13px; color: #a0aec0; text-align: center; margin-bottom: 28px; }
    .qr-wrap { text-align: center; margin: 0 auto 24px; }
    .url { font-size: 13px; color: #2b7a9e; text-align: center; word-break: break-all; margin-bottom: 24px; }
    .instruction { font-size: 15px; text-align: center; color: #4a5568; margin-bottom: 32px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #718096; font-size: 12px; }
    .footer strong { color: #1a202c; }
  </style>
</head>
<body>
  <div class="header">
    <div class="shelter-name">${shelter}</div>
    <div class="powered">Powered by PetVue · ${date}</div>
  </div>

  <div class="animal-name">${name}</div>
  <div class="animal-sub">${breed ? `${breed} · ` : ''}${species}</div>
  <div class="case-id">Case ID: ${caseId}</div>

  <div class="qr-wrap">${qrSection}</div>
  <div class="url">${url}</div>

  <div class="instruction">
    📱 Scan the QR code to view ${name}'s full profile, health history, and apply to adopt.
  </div>

  <div class="footer">
    ${phone ? `<strong>Contact:</strong> ${phone} · ` : ''}<strong>${shelter}</strong>
  </div>
</body>
</html>`;
};

// ── Toggle public profile ─────────────────────────────────────────────────────

/**
 * Enables or disables the public profile for an animal.
 * Records the first generation timestamp on first enable.
 */
export const togglePublicProfile = async (
  animal: Animal,
  enabled: boolean,
): Promise<Animal> => {
  const patch: Partial<Animal> = {
    publicProfileEnabled: enabled,
    publicProfileSlug: animal.publicProfileSlug || animal.caseId,
  };
  // Only set qrGeneratedAt on first-ever enable
  if (enabled && !animal.qrGeneratedAt) {
    patch.qrGeneratedAt = new Date().toISOString();
  }
  return updateAnimal(animal.id, patch);
};
