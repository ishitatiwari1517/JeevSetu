// AI scan endpoint configuration.
//
// After running `amplify push`, the REST API "petvueapi" is wired into
// aws-exports.js automatically and the Amplify SDK can resolve it by name —
// nothing else is needed.
//
// If you have not yet run `amplify push` but want to call a Lambda you have
// deployed by hand, set SCAN_ENDPOINT_OVERRIDE to its full POST URL
// (e.g. an API Gateway invoke URL).

export const SCAN_API_NAME = 'petvueapi';
export const SCAN_API_PATH = '/scan';
export const SCAN_ENDPOINT_OVERRIDE = null;

// ---- Multi-image pipeline (Phase 2 #6/#7) ----------------------------------
//
// Flip USE_NEW_PIPELINE to true once `amplify push` has provisioned the new
// Lambdas, S3 bucket, SQS queue, and DynamoDB table per
// docs/backend/scan-pipeline.md. Until then the client uses the legacy
// single-image base64 path.

export const USE_NEW_PIPELINE = false;
export const SCAN_INITIATE_PATH = '/scan/initiate';
export const SCAN_PROCESS_PATH = (scanId) => `/scan/${scanId}/process`;
export const SCAN_RESULT_PATH = (scanId) => `/scan/${scanId}/result`;

// Polling settings for the new pipeline result endpoint.
export const SCAN_POLL_INTERVAL_MS = 2000;
export const SCAN_POLL_TIMEOUT_MS = 60_000;
