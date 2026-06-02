import { defineConfig } from '@hey-api/openapi-ts';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Resolve paths relative to THIS package so the recipe is portable across the
// sibling SDK lanes (#279-284) — only the service slug changes.
const here = dirname(fileURLToPath(import.meta.url));

// Source of truth: the OpenAPI 3.1 the notify-service emits from its TypeSpec
// contract via `bun run spec:openapi` (= `tsp compile specs/notify.tsp`).
// scripts/generate.mjs runs that compile first, so this file always exists.
const openapiInput = resolve(here, '../../services/notify-service/dist/openapi.yaml');

export default defineConfig({
  input: openapiInput,
  output: {
    path: resolve(here, 'src/rest'),
    // No generator-side lint/format — the committed output stays deterministic
    // so the drift guard can rely on byte-equality. (`postProcess: []` is the
    // non-deprecated form of the old `format: false` / `lint: false`.)
    postProcess: [],
  },
  plugins: ['@hey-api/client-fetch'],
});
