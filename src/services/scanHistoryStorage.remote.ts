import { ScanHistoryStorage } from './scanHistoryStorage';

const NOT_IMPLEMENTED = (method: string) =>
  new Error(`remoteScanHistoryStorage.${method} is not yet wired. See docs/backend/pets.md (and the future scans table spec).`);

export const remoteScanHistoryStorage: ScanHistoryStorage = {
  async list(_userId) {
    // TODO: GET /scans — Lambda queries DynamoDB `scans` table by GSI userId, ordered by createdAt desc.
    throw NOT_IMPLEMENTED('list');
  },

  async get(_userId, _scanId) {
    // TODO: GET /scans/{scanId} — Lambda GetItem; refuse if scan.userId !== caller.userId.
    throw NOT_IMPLEMENTED('get');
  },

  async record(_userId, _input) {
    // TODO: POST /scans — Lambda PutItem with userId from Cognito JWT, server-generated id + createdAt.
    // Hero image: stored as S3 object key (uploaded earlier in scan pipeline #6); Lambda returns presigned GET URL on read.
    throw NOT_IMPLEMENTED('record');
  },
};
