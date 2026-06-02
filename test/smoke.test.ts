// Consumer smoke (Epic #24 acceptance #2: "consumable from a sample app with
// zero hand-written client code"). This file IS the sample consumer: it imports
// ONLY the published SDK surface and exercises the typed operations + event
// types — no hand-written HTTP/Kafka plumbing, no manual fetch, no DTO copies.

import { afterEach, describe, expect, test } from 'bun:test';
// The `createClient` factory is re-exported through the SDK's REST barrel
// (src/rest/client/index.ts). PR#177 raised a Critical against that re-export
// target; this import asserts the barrel resolves the factory in EVERY SDK
// regen (recipe-level guard baked into `gen:sdk`). See #308.
import { createClient } from '../src/rest/client';
import {
  client,
  notifysHealth,
  notifysProtectedProbe,
  notifysProtectedWrite,
  notifysRead,
  type EventHeaders,
  type HealthStatus,
  type NotifyEventPayload,
  type NotifyRead,
  type NotifyWriteInput,
  type WriteAck,
} from '../src/index';

// PR#177 F10: the `client` singleton's config leaks across tests when each test
// mutates it via setConfig. Reset it after every test so order-independence
// holds (recipe-level — folded into the `gen:sdk`-emitted smoke).
afterEach(() => {
  client.setConfig({ baseUrl: undefined });
});

describe('@curaos/notify-sdk consumer surface', () => {
  test('exposes typed REST operation functions', () => {
    expect(typeof notifysHealth).toBe('function');
    expect(typeof notifysProtectedProbe).toBe('function');
    expect(typeof notifysProtectedWrite).toBe('function');
    expect(typeof notifysRead).toBe('function');
  });

  test('re-exports a working createClient factory through the REST barrel', () => {
    // PR#177 Critical guard: `export { createClient } from './client.gen'`
    // must resolve to a callable factory. A broken barrel re-export fails here
    // (and at typecheck) in every SDK, not just notify.
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

  test('REST request/response types match the service contract', () => {
    // Pure type-level assertions: these must compile against the generated
    // types. A contract change that breaks the shape fails `bun run typecheck`.
    const write: NotifyWriteInput = { reason: 'smoke' };
    const ack: WriteAck = { status: 'ok', layer: 'core', actorId: 'a-1' };
    const read: NotifyRead = {
      id: 'n-1',
      status: 'ok',
      layer: 'core',
      actorId: 'a-1',
    };
    const health: HealthStatus = { status: 'ok', layer: 'core' };
    expect(write.reason).toBe('smoke');
    expect(ack.actorId).toBe('a-1');
    expect(read.id).toBe('n-1');
    expect(health.status).toBe('ok');
  });

  test('exposes event wire-types for the consumer event surface', () => {
    const payload: NotifyEventPayload = {
      type: 'NotifyCreated',
      actor_id: 'n-1',
      actor_type: 'notify',
      display_name: 'demo',
      tenant_id: 't-1',
      deleted_at: '',
      occurred_at: '2026-06-02T00:00:00Z',
    };
    const headers: EventHeaders = {
      event_type: 'NotifyCreated',
      tenant_id: 't-1',
      actor_id: 'n-1',
      actor_type: 'notify',
      correlation_id: 'c-1',
      occurred_at: '2026-06-02T00:00:00Z',
    };
    expect(payload.type).toBe('NotifyCreated');
    expect(headers.correlation_id).toBe('c-1');
  });
});
