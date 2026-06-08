# @curaos/notify-sdk

Typed client for `notify-service` - REST operations and event wire-types,
**generated from the service's contracts**. No hand-written HTTP or Kafka
plumbing; the SDK is the only client code a consumer needs.

- REST client + request/response types ← `notify-service/specs/notify.tsp`
  (TypeSpec → OpenAPI 3.1 → [`@hey-api/openapi-ts`](https://heyapi.dev)).
- Event payload + header types ← `notify-service/specs/notify.asyncapi.yaml`
  (AsyncAPI 3.0.0 → `@asyncapi/parser` → `json-schema-to-typescript`).

## Installation

```sh
bun add @curaos/notify-sdk
```

The package publishes to the CuraOS Verdaccio registry; `.npmrc` already scopes
`@curaos:registry=http://localhost:4873`.

## Usage

Point the client at a running `notify-service` once, then call typed operations:

```ts
import { client, notifysHealth, notifysProtectedWrite, notifysRead } from '@curaos/notify-sdk';

client.setConfig({ baseUrl: 'http://localhost:3000' });

const health = await notifysHealth();

const ack = await notifysProtectedWrite({
  headers: { Authorization: `Bearer ${token}` },
  body: { reason: 'demo write' }, // the ONLY accepted field (1..512 chars)
});

const item = await notifysRead({
  path: { id: 'n-1' },
  headers: { Authorization: `Bearer ${token}` },
});
```

Per-call client override (e.g. a second base URL):

```ts
import { createClient } from '@hey-api/client-fetch';

const other = createClient({ baseUrl: 'https://gateway/api/v1/notify' });
await notifysHealth({ client: other });
```

## Event wire-types

For event consumers, the SDK ships the **snake_case** envelope types the
producer emits (do not camelCase - they are the on-the-wire contract):

```ts
import type { NotifyEventPayload, EventHeaders } from '@curaos/notify-sdk';

function onNotify(payload: NotifyEventPayload, headers: EventHeaders) {
  if (payload.type === 'NotifyCreated') { /* … */ }
}
```

> **Note (codegen #306):** `display_name` and `deleted_at` are nullable on the
> wire but currently type as `string` (not `string | null`) - the source
> AsyncAPI uses the deprecated `nullable: true` form that AsyncAPI 3.0.0
> (JSON Schema 2020-12) does not honor. The types tighten to `| null` once #306
> lands the 2020-12 `type: [..., "null"]` form and the spec is regenerated.

## Regenerating from the contract

One command re-runs the whole chain (service spec compile → REST client → event
types) from the committed contracts:

```sh
bun run generate
```

The generated output under `src/` is committed and guarded: `test/drift.test.ts`
fails if the committed SDK is not byte-identical to a fresh regeneration - a
contract change that was not re-run through `bun run generate`, or a generator
version bump, is caught in CI.

## Commands

```sh
bunx turbo run typecheck --filter=@curaos/notify-sdk
bunx turbo run test      --filter=@curaos/notify-sdk
bunx turbo run build     --filter=@curaos/notify-sdk
```
