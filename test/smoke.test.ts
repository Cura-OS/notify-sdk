// Consumer smoke (Epic #24 acceptance #2: "consumable from a sample app with
// zero hand-written client code"). This file IS the sample consumer: it imports
// ONLY the published SDK surface and exercises the typed operations + event
// types — no hand-written HTTP/Kafka plumbing, no manual fetch, no DTO copies.

import { describe, expect, test } from 'bun:test';
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

describe('@curaos/notify-sdk consumer surface', () => {
  test('exposes typed REST operation functions', () => {
    expect(typeof notifysHealth).toBe('function');
    expect(typeof notifysProtectedProbe).toBe('function');
    expect(typeof notifysProtectedWrite).toBe('function');
    expect(typeof notifysRead).toBe('function');
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
