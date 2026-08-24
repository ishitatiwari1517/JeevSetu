# Pet profile backend handoff

The frontend pet data layer (`src/services/petService.ts`, `petStorage.local.ts`,
`petStorage.remote.ts`) is wired to a local AsyncStorage stub. When the AWS
backend is provisioned, only `petStorage.remote.ts` needs implementation and
the `USE_REMOTE` flag in `petService.ts` flips to `true`.

This document is the spec for that backend.

## Resources to provision

### DynamoDB — `pets` table

| Attribute   | Type   | Notes                                    |
|-------------|--------|------------------------------------------|
| `id`        | string | Partition key. UUID v4, server-generated |
| `userId`    | string | Cognito `sub`. GSI partition key         |
| `name`      | string |                                          |
| `breed`     | string |                                          |
| `gender`    | string | `male` \| `female` \| `unknown`          |
| `dob`       | string | ISO date `YYYY-MM-DD`                    |
| `weightKg`  | number |                                          |
| `avatarKey` | string | S3 object key (optional)                 |
| `createdAt` | string | ISO timestamp                            |
| `updatedAt` | string | ISO timestamp                            |

**GSI**: `byUser` — partition key `userId`, sort key `createdAt`. Used by `GET /pets` to list a user's pets in creation order.

### S3 — pet avatars

Bucket: reuse the existing app bucket (or `petvue-pet-avatars-{env}`).
Object key: `pets/{userId}/{petId}/avatar.jpg`.
Access: presigned PUT (5 min TTL) issued by Lambda after auth check.
Public read: NO. Frontend gets presigned GET URLs through the API.

### REST endpoints (API Gateway + Lambda)

All endpoints require Cognito JWT. Lambda extracts `userId` from
`event.requestContext.authorizer.claims.sub` — never trust a `userId` from the
request body.

| Method | Path              | Lambda action                                                            |
|--------|-------------------|--------------------------------------------------------------------------|
| GET    | `/pets`           | Query `byUser` GSI by caller's `userId`. Return `Pet[]`                  |
| GET    | `/pets/{petId}`   | GetItem on `pets`. Refuse if `pet.userId !== caller.userId`              |
| POST   | `/pets`           | Validate body (`CreatePetInput`), generate id + timestamps, PutItem      |
| PATCH  | `/pets/{petId}`   | Validate ownership, then UpdateItem with allowed fields only             |
| DELETE | `/pets/{petId}`   | Validate ownership, DeleteItem. Cascade rules below                      |
| POST   | `/pets/{petId}/avatar` | Validate ownership, return presigned PUT URL for `pets/{userId}/{petId}/avatar.jpg`. Frontend uploads, then calls PATCH `/pets/{petId}` with `avatarKey` |

**Cascade on delete**: TBD. For MVP, soft-fail if pet has scans (return 409). Hard-delete cascade once `scans`, `vaccinations`, `appointments` tables exist.

## Amplify CLI commands (suggested)

```bash
# Storage (S3 bucket for avatars + scan images, if not already provisioned)
amplify add storage     # Content (Images, audio, video, etc.)

# REST API
amplify add api         # REST, Lambda function backing
                        # Auth: Amazon Cognito User Pool

# DynamoDB table — choose "NoSQL Database" inside the Lambda config,
# or provision standalone via amplify add storage > "NoSQL Database"
amplify add storage     # NoSQL Database

amplify push
```

After `amplify push`:

1. Replace stubs in `src/services/petStorage.remote.ts` with `fetchAuthSession` + `fetch` calls (or `aws-amplify/api`'s `get/post/patch/del`) to the new endpoints.
2. Set `USE_REMOTE = true` in `src/services/petService.ts`.
3. Delete `src/services/petStorage.local.ts` once a one-time AsyncStorage → DynamoDB migration is done for any test users (or keep it as a dev fallback behind an env flag).

## Frontend contract — what `remote.ts` must satisfy

The interface lives in `src/services/petStorage.ts` (`PetStorage`). Each method's
TODO comment in `petStorage.remote.ts` pairs to a row in the table above. The
local impl is the reference behavior — same input/output shapes, same error
semantics (throw `Error("Pet not found: ...")` on missing items in `update`).

## Out of scope for this PR

- Real Amplify CLI runs (requires AWS account access).
- Image upload UX (avatar picker is part of Phase 1 #3 — Pet Profile screen).
- Migration tool for existing AsyncStorage entries to DynamoDB. None exist yet so this is moot until anyone other than dev uses the local impl.
