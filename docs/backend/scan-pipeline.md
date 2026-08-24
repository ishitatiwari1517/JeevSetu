# Scan pipeline backend deployment runbook

This runbook walks through deploying the Phase 2 backend (#6 + #7) — the four new Lambdas, the S3 bucket / SQS queue / DynamoDB scans table, and the API Gateway routes that connect them.

After this runs, the new pipeline is live in your AWS account but the **frontend doesn't use it yet**. Backend-C flips the `USE_NEW_PIPELINE` flag in the React Native client to switch over.

---

## Prerequisites

- Amplify CLI installed and logged in (`amplify --version`).
- You're on the `dev` env: `amplify env list` shows `dev` as current.
- AWS account access — you'll see CloudFormation activity in the AWS console after `amplify push`.
- The existing `aiScan` Lambda is already deployed and working (it is — we built on top of it).

## What this PR added to your repo

```
amplify/backend/
├── backend-config.json                                ← updated
├── api/petvueapi/petvueapi-cloudformation-template.json  ← updated (3 new routes + Cognito authorizer)
├── function/
│   ├── scanInitiate/    ← new Lambda
│   ├── scanEnqueue/     ← new Lambda
│   ├── scanWorker/      ← new Lambda (SQS-triggered)
│   └── scanResult/      ← new Lambda
└── custom/scanPipelineResources/                      ← new — single CFN for S3 + SQS + DDB
```

Lambda source code lives at `amplify/backend/function/<name>/src/`. CloudFormation templates are at the function root.

---

## Step 1 — Configure the secrets parameter for `scanWorker`

The worker reads `ANTHROPIC_API_KEY` from SSM at the path
`/amplify/<appId>/<env>/AMPLIFY_scanWorker_ANTHROPIC_API_KEY`. Amplify
manages this for you; you just set the value once.

```bash
amplify update function
# Choose: scanWorker
# Choose: Secret values configuration → Add a secret
# Name:   ANTHROPIC_API_KEY
# Value:  <paste the same key the existing aiScan Lambda uses>
# Save
```

> **What you fill in**: the same Anthropic API key the existing aiScan
> Lambda uses. If you don't remember it, run `amplify update function`
> against `aiScan` to view-or-update the existing secret first.

If you'd rather not duplicate the key, you can change the worker to
read from the same SSM path as aiScan. To do that, edit
`amplify/backend/function/scanWorker/scanWorker-cloudformation-template.json`
and change the `Environment.Variables.ANTHROPIC_API_KEY` block from

```jsonc
"functionName": "scanWorker"
```

to

```jsonc
"functionName": "aiScan"
```

(in two places — the env var and the IAM resource). Then skip the
`amplify update function` secret step above; the worker will reuse
aiScan's key.

---

## Step 2 — Install Lambda dependencies

Each new Lambda has a `package.json`. Amplify installs deps during
`amplify push`, but to be safe and to validate locally:

```bash
cd amplify/backend/function/scanInitiate/src && npm install --omit=dev
cd ../../scanEnqueue/src && npm install --omit=dev
cd ../../scanWorker/src && npm install --omit=dev
cd ../../scanResult/src && npm install --omit=dev
cd -
```

If any install fails, fix and retry. `amplify push` will fail loudly
otherwise.

---

## Step 3 — Run `amplify push`

```bash
amplify status
```

Expected output (paths abbreviated):

```
Current Environment: dev

| Category | Resource name           | Operation | Provider plugin   |
| -------- | ----------------------- | --------- | ----------------- |
| Custom   | scanPipelineResources   | Create    | awscloudformation |
| Function | scanInitiate            | Create    | awscloudformation |
| Function | scanEnqueue             | Create    | awscloudformation |
| Function | scanWorker              | Create    | awscloudformation |
| Function | scanResult              | Create    | awscloudformation |
| Function | aiScan                  | No Change | awscloudformation |
| Api      | petvueapi               | Update    | awscloudformation |
| Auth     | petvueauth              | No Change | awscloudformation |
```

If anything else shows up (especially `Update` on `aiScan` or
`petvueauth`), stop and inspect — those are the existing working
resources and should not change.

```bash
amplify push
```

Confirm `Y` at the prompt. Expect ~5–10 minutes for first-time deploy
because it provisions: 1 S3 bucket, 2 SQS queues (main + DLQ), 1 DDB
table, 4 Lambdas, 4 IAM roles + policies, API Gateway methods, the
Lambda EventSourceMapping, and the Cognito authorizer.

---

## Step 4 — Verify the deploy

### S3 bucket exists
```bash
aws s3 ls | grep petvue-scans
```
Should show `petvue-scans-<accountId>-dev`.

### DynamoDB table exists
```bash
aws dynamodb describe-table --table-name petvue-scans-dev \
  --query 'Table.{Status: TableStatus, GSI: GlobalSecondaryIndexes[].IndexName}'
```
Should show `Status: ACTIVE` and `GSI: ["byUser"]`.

### SQS queues exist
```bash
aws sqs list-queues --queue-name-prefix petvue-scan-queue
```
Should show `petvue-scan-queue-dev` and `petvue-scan-queue-dlq-dev`.

### Lambdas are wired
```bash
aws lambda get-event-source-mapping \
  --uuid $(aws lambda list-event-source-mappings \
    --function-name scanWorker-dev --query 'EventSourceMappings[0].UUID' --output text) \
  --query '{State: State, Source: EventSourceArn}'
```
Should show `State: Enabled` and the source pointing at
`petvue-scan-queue-dev`.

### API routes exist
The Outputs of the API stack include `RootUrl`. Get it via:
```bash
aws cloudformation describe-stacks \
  --stack-name $(aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
    --query "StackSummaries[?contains(StackName,'apipetvueapi')].StackName | [0]" \
    --output text) \
  --query 'Stacks[0].Outputs[?OutputKey==`RootUrl`].OutputValue' --output text
```

Smoke test (use a Cognito JWT — easiest path: copy the `Authorization`
header out of the running app's `runMultiImageScan` once it's wired up
in Backend-C):

```bash
curl -X POST "${ROOT_URL}/scan/initiate" \
  -H "Authorization: <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"imageCount": 2, "mediaType": "image/jpeg"}'
```

Expect:
```json
{
  "scanId": "...",
  "presigned": [{ "key": "...", "uploadUrl": "..." }, ...],
  "expiresIn": 300
}
```

---

## Step 5 — End-to-end smoke test (after Backend-C is deployed)

Backend-C's PR description has the full smoke test (capture → upload →
process → poll). Until then you can hand-curl through the steps using
the JWT from a browser session.

---

## Troubleshooting

### `amplify push` complains about a circular dependency
The function CFN templates take outputs from `scanPipelineResources`
custom stack. If you renamed the custom resource, update both
`backend-config.json` and the `customscanPipelineResources*` parameter
names in each function's CFN template. Both must match.

### CloudFormation rolls back with `BucketAlreadyExists`
Bucket names are globally unique. The default name is
`petvue-scans-<accountId>-<env>`. If the stack rolled back due to a
name collision, edit
`amplify/backend/custom/scanPipelineResources/scanPipelineResources-cloudformation-template.json`
and change the `BucketName` Fn::Sub format to something unique.

### CloudFormation rolls back on `Authorizer` create
The Cognito authorizer requires the `petvueauth` user pool ARN. Check
that the new `dependsOn` block on `petvueapi` in `backend-config.json`
includes `auth/petvueauth` with attribute `UserPoolArn`. If you see
`Cannot find a user pool` errors, that dependency is missing.

### `EventSourceMapping` fails to create
The worker IAM role must include `sqs:ReceiveMessage`,
`sqs:DeleteMessage`, `sqs:GetQueueAttributes`,
`sqs:ChangeMessageVisibility` on the queue ARN. These are in
`scanWorker-cloudformation-template.json` under `SQSReceivePolicy`.

### Worker invocations fail with `403 SSM:GetParameter`
SSM path mismatch. The worker reads from
`/amplify/<appId>/<env>/AMPLIFY_scanWorker_ANTHROPIC_API_KEY`. Make sure
you ran the secret-update step (Step 1) and the parameter exists in
SSM:
```bash
aws ssm get-parameter --name "/amplify/<appId>/<env>/AMPLIFY_scanWorker_ANTHROPIC_API_KEY" --with-decryption
```

### Worker invocations fail on the SQS visibility timeout
Default visibility timeout is 180s. If Claude calls take longer (rare
with Haiku 4.5), bump
`amplify/backend/custom/scanPipelineResources/scanPipelineResources-cloudformation-template.json`
→ `ScanQueue.Properties.VisibilityTimeout`.

---

## Rollback

If something is wrong and you want to undo:

```bash
amplify env checkout dev   # ensure correct env
amplify remove function    # repeat for scanInitiate / scanEnqueue / scanWorker / scanResult
amplify remove custom      # scanPipelineResources
# Manually revert the petvueapi-cloudformation-template.json (use git checkout)
git checkout main -- amplify/backend/api/petvueapi/petvueapi-cloudformation-template.json
git checkout main -- amplify/backend/backend-config.json
amplify push
```

The DDB table, S3 bucket, and SQS queues will be deleted by
CloudFormation (set `DeletionPolicy` if you want to keep them — not
default).

---

## Cost expectations (dev usage)

- DynamoDB on-demand: ~$0 baseline; $1.25/M writes.
- S3: pennies per GB stored, free tier covers most of dev.
- SQS: pennies per million requests.
- Lambda: free tier (1M req/mo, 400k GB-s/mo) covers all dev usage.
- **Anthropic API**: Claude Haiku 4.5 is ~$0.001 per image scanned. The
  bulk of cost. With 6 images per scan ensemble, ~$0.006/scan.

For prod, expect this to scale roughly linearly with scan volume.

---

## Things you'll need to fill in

| Where | What | Default if you skip |
|-------|------|---------------------|
| Step 1 (secret) | `ANTHROPIC_API_KEY` value for `scanWorker` | None — you must do this |
| `scanPipelineResources-cloudformation-template.json` | S3 bucket name | `petvue-scans-<accountId>-<env>` |
| Same file | SQS visibility timeout | 180s |
| Same file | DDB table name | `petvue-scans-<env>` |
| `scanWorker-cloudformation-template.json` | `MODEL_ID` | `claude-haiku-4-5` |

If you want to override any of these, edit the file before running
`amplify push`. Defaults match what the frontend client expects in
Backend-C.
