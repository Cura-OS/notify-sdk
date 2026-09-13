// Replayable-mock cassette harness for CI e2e ONLY (XSRC-E15-4).
//
// Captured request/response = source of truth (per the CuraOS mocks contract):
// this recorder wraps `fetch` for external-provider (BYO connector) calls so a
// person-journey e2e (booking, claim submit, ...) is deterministic in CI
// without live third parties. It is confined to unit tests + the CI e2e
// harness; never the app runtime data plane
// (see [[curaos-demo-sample-data-rule]]); this file must never be imported by
// application runtime code, only by test files.
//
// Modes (CURAOS_TEST_MOCKS env var - the existing repo-wide test-mock switch):
//   'record' - calls the REAL fetch, then writes the cassette fixture to disk.
//              Local/human-run only; never set in CI.
//   anything else (the CI default) - REPLAY ONLY. Reads the committed
//              cassette; a miss throws instead of silently issuing a live
//              call, so CI can never depend on network access or leak into a
//              real third-party integration.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface Cassette {
  readonly request: { readonly method: string; readonly url: string; readonly body?: string };
  readonly response: { readonly status: number; readonly body: string };
}

const CASSETTE_DIR = join(import.meta.dir);

function cassettePath(name: string): string {
  return join(CASSETTE_DIR, `${name}.json`);
}

function isRecordMode(): boolean {
  return process.env.CURAOS_TEST_MOCKS === 'record';
}

/**
 * Fetch through the cassette. `name` identifies the fixture file
 * (`test/cassettes/<name>.json`) - one cassette per external call site.
 *
 * Record mode issues the real request and captures it; every other mode
 * (the CI default) replays the committed cassette and FAILS CLOSED - a
 * missing cassette is a test-authoring bug, never a live-network fallback.
 */
export async function recordedFetch(
  name: string,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const path = cassettePath(name);
  if (isRecordMode()) {
    const res = await fetch(input, init);
    const body = await res.clone().text();
    const cassette: Cassette = {
      request: { method: init?.method ?? 'GET', url: input, ...(init?.body ? { body: String(init.body) } : {}) },
      response: { status: res.status, body },
    };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(cassette, null, 2)}\n`);
    return res;
  }
  if (!existsSync(path)) {
    throw new Error(
      `no cassette recorded for "${name}" (${path}). Run with ` +
        'CURAOS_TEST_MOCKS=record locally (never in CI) to capture it, then commit the fixture.',
    );
  }
  const cassette = JSON.parse(readFileSync(path, 'utf8')) as Cassette;
  return new Response(cassette.response.body, { status: cassette.response.status });
}
