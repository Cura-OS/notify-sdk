// Consumer smoke: this file IS the sample consumer. It imports ONLY the
// published SDK surface and exercises the typed operations + the client +
// event types - no hand-written HTTP/Kafka plumbing, no manual fetch, no DTO
// copies.
//
// The recipe-stable assertions below (`createClient` barrel + `client`
// instance) are emitted by `gen:sdk` and are identical across every SDK. After
// you run `bun run generate`, ADD the service-specific operation + event-type
// assertions (the operation/type names come from the notify-service contract).

import { afterEach, describe, expect, test } from 'bun:test';
// The `createClient` factory is re-exported through the SDK's REST barrel
// (src/rest/client/index.ts). PR#177 raised a Critical against that re-export
// target; this import asserts the barrel resolves the factory in EVERY SDK
// regen (recipe-level guard baked into `gen:sdk`). See #308.
import { createClient } from '../src/rest/client';
import { client } from '../src/index';
import { recordedFetch } from './cassettes/recorder';

// The `client` singleton's config leaks across tests when each test mutates it
// via setConfig. Reset it after every test so order-independence holds (PR#177
// F10, folded into the `gen:sdk`-emitted smoke).
afterEach(() => {
  client.setConfig({ baseUrl: undefined });
});

describe('@curaos/notify-sdk consumer surface', () => {
  test('re-exports a working createClient factory through the REST barrel', () => {
    // PR#177 Critical guard: `export { createClient } from './client.gen'`
    // must resolve to a callable factory. A broken barrel re-export fails here
    // (and at typecheck) in every SDK, not just one.
    expect(typeof createClient).toBe('function');
    const isolated = createClient({ baseUrl: 'http://localhost:4001' });
    expect(typeof isolated.request).toBe('function');
    expect(typeof isolated.setConfig).toBe('function');
  });

  test('exposes a configurable client instance', () => {
    expect(client).toBeDefined();
    expect(typeof client.setConfig).toBe('function');
    // A consumer points the SDK at a service with ONE call, no plumbing.
    const cfg = client.setConfig({ baseUrl: 'http://localhost:3000' });
    expect(cfg.baseUrl).toBe('http://localhost:3000');
  });

  test('cassette replay refuses a missing fixture before any live request', async () => {
    await expect(recordedFetch('__missing__', 'https://example.invalid')).rejects.toThrow(
      'no cassette recorded',
    );
  });

  // TODO (after `bun run generate`): import the generated operation functions +
  // request/response types + event wire-types from '../src/index' and assert
  // their shapes here (mirror notify-sdk/test/smoke.test.ts).
});
