// Step model for the scan-processing screen, per PRD §6.4.
//
// Today the lambda is a single round-trip; we still walk the user through
// four discrete stages (rather than a spinner) because PRD §6.4 calls out
// that named-step progress is materially better for tolerated wait time
// than an unknown-duration spinner.
//
// Logic is kept pure here so the timing model is testable; the screen wires
// it to a useEffect interval and to the actual scan promise resolution.

export type StepKey = 'upload' | 'quality' | 'analysis' | 'finalize';

export interface Step {
  key: StepKey;
  label: string;
  short: string;
}

export const STEPS: ReadonlyArray<Step> = [
  { key: 'upload',   label: 'Uploading photos…',         short: 'Upload' },
  { key: 'quality',  label: 'Checking image quality…',   short: 'Quality' },
  { key: 'analysis', label: 'Running visual analysis…',  short: 'Analyze' },
  { key: 'finalize', label: 'Preparing your report…',    short: 'Report' },
];

// Each step gets at least this long on screen so the indicator doesn't flicker
// past stages when the lambda happens to be fast.
export const STEP_DURATION_MS = 700;

// PRD §6.4 slow-connection fallback threshold.
export const SLOW_THRESHOLD_MS = 10_000;

/**
 * Pick the active step for a given elapsed time and scan-completion state.
 *
 * Behavior:
 *  - While the scan is in flight, advance through `upload` → `quality` →
 *    `analysis` and *hold* on `analysis` (don't reach `finalize` until the
 *    lambda actually returns — that final step is "preparing report".)
 *  - Once `scanComplete = true`, jump to `finalize` and hold there for one
 *    more `STEP_DURATION_MS` window before the screen replaces itself with
 *    the result. Caller decides when to navigate.
 */
export const computeStep = (elapsedMs: number, scanComplete: boolean): StepKey => {
  if (scanComplete) return 'finalize';
  if (elapsedMs < STEP_DURATION_MS) return 'upload';
  if (elapsedMs < STEP_DURATION_MS * 2) return 'quality';
  return 'analysis';
};

/**
 * Index of `step` within STEPS — useful for rendering the connecting bar
 * (filled = up to and including this step).
 */
export const stepIndex = (step: StepKey): number => STEPS.findIndex(s => s.key === step);

/**
 * Bar fill fraction (0..1) for a given active step. The bar fills evenly
 * across the four stages; complete = 1.
 */
export const progressFraction = (step: StepKey): number => {
  const i = stepIndex(step);
  if (i < 0) return 0;
  return (i + 1) / STEPS.length;
};

/**
 * Should we show the slow-connection banner? Triggered if we're still on the
 * upload stage past the threshold — every other stage is server-side and
 * doesn't represent a user-side network problem.
 */
export const isSlowConnection = (elapsedMs: number, step: StepKey): boolean =>
  elapsedMs >= SLOW_THRESHOLD_MS && step === 'upload';
