import { PetStorage } from './petStorage';

const NOT_IMPLEMENTED = (method: string) =>
  new Error(`remotePetStorage.${method} is not yet wired. See docs/backend/pets.md.`);

export const remotePetStorage: PetStorage = {
  async list(_userId) {
    // TODO: GET /pets — Lambda queries DynamoDB `pets` table by GSI userId.
    throw NOT_IMPLEMENTED('list');
  },

  async get(_userId, _petId) {
    // TODO: GET /pets/{petId} — Lambda GetItem on `pets` table, partition key id.
    throw NOT_IMPLEMENTED('get');
  },

  async create(_userId, _input) {
    // TODO: POST /pets — Lambda PutItem with userId from Cognito JWT, server-generated id + timestamps.
    throw NOT_IMPLEMENTED('create');
  },

  async update(_userId, _petId, _patch) {
    // TODO: PATCH /pets/{petId} — Lambda UpdateItem; refuse if pet.userId !== caller.userId.
    throw NOT_IMPLEMENTED('update');
  },

  async delete(_userId, _petId) {
    // TODO: DELETE /pets/{petId} — Lambda DeleteItem; cascade scans/vaccinations/appointments policy TBD.
    throw NOT_IMPLEMENTED('delete');
  },

  async setAvatar(_userId, _petId, _localUri) {
    // TODO: presigned PUT to S3 (key: pets/{userId}/{petId}/avatar.jpg) → PATCH /pets/{petId} with avatarKey.
    throw NOT_IMPLEMENTED('setAvatar');
  },
};
