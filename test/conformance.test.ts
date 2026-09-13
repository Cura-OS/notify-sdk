// Typed request/response PARITY guard (SDK <-> contract). Sibling of
// test/drift.test.ts: drift proves byte-equality after a full regen; this proves
// EVERY operation function's request + response/error types still resolve to a
// type the contract emitted into types.gen.ts. Reads only the committed
// generated output - no source-service checkout, no `bun run generate`. A
// contract change that retypes/renames/drops an operation's request or response
// shape leaves a dangling type reference and fails here, at ONE place, before it
// reaches any surface that calls @curaos/notify-sdk. Emitted by `gen:sdk` (#308,
// XSRC-E15-2) so the guard regenerates identically for every SDK.

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const restDir = join(import.meta.dir, '..', 'src', 'rest');
const sdkGen = join(restDir, 'sdk.gen.ts');
const typesGen = join(restDir, 'types.gen.ts');

// Each generated operation function:
//   export const <op> = <ThrowOnError ...>(options[?]: Options<XData, ...>):
//     RequestResult<XResponses, XErrors, ...> => ...
// Capture the operation name + the three contract-derived type identifiers it
// consumes (request Data, response Responses, error Errors).
const OP_RE =
  /export const (\w+) =[^(]*\(\s*options\??:\s*Options<\s*(\w+)[^)]*\):\s*RequestResult<\s*(\w+)\s*,\s*(\w+)/g;

// Every `export type Foo = ...` the contract emitted into types.gen.ts.
const TYPE_RE = /export type (\w+)\s*=/g;

function exportedTypes(source) {
  const names = new Set();
  let m;
  TYPE_RE.lastIndex = 0;
  while ((m = TYPE_RE.exec(source)) !== null) names.add(m[1]);
  return names;
}

function operations(source) {
  const ops = [];
  let m;
  OP_RE.lastIndex = 0;
  while ((m = OP_RE.exec(source)) !== null) {
    ops.push({ op: m[1], data: m[2], responses: m[3], errors: m[4] });
  }
  return ops;
}

describe('SDK <-> contract typed parity', () => {
  // The committed generated output is required: this SDK has been `generate`d.
  // (A brand-new scaffold that has not been generated yet has no src/rest/**;
  // skip rather than fail so the recipe scaffold's own `bun test` stays green
  // until `bun run generate` fills the generated surface.)
  const ready = existsSync(sdkGen) && existsSync(typesGen);

  test.if(ready)('every operation request + response type is in the contract surface', () => {
    const ops = operations(readFileSync(sdkGen, 'utf8'));
    const types = exportedTypes(readFileSync(typesGen, 'utf8'));

    // A generated SDK with REST routes MUST expose operation functions. An empty
    // set means the regen produced no operations (broken OpenAPI input).
    expect(ops.length, 'sdk.gen.ts exposes no operation functions').toBeGreaterThan(0);

    for (const { op, data, responses, errors } of ops) {
      for (const ref of [data, responses, errors]) {
        expect(
          types.has(ref),
          `operation "${op}" references request/response type "${ref}" that the ` +
            `contract did not emit into types.gen.ts (typed SDK<->contract drift). ` +
            `Re-run \`bun run generate\` so the SDK matches the contract.`,
        ).toBe(true);
      }
    }
  });

  test.skipIf(ready)('generated surface not present yet (run `bun run generate`)', () => {
    // Recipe scaffold before `generate`: nothing to check. drift.test + this
    // guard both come alive once src/rest/** is filled.
    expect(ready).toBe(false);
  });
});
