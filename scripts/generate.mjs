// One-command contract → SDK regeneration (the contract-drift guard's regen
// step). The reusable recipe emitted by `gen:sdk` (#308):
//
//   1. compile the service TypeSpec contract -> OpenAPI 3.1 (spec:openapi)
//   2. @hey-api/openapi-ts: OpenAPI -> typed REST client (src/rest)
//   3. gen-events.mjs: AsyncAPI -> typed event wire-types (src/events.gen.ts)
//   4. biome format the emitted index files so committed == hook == fresh-regen
//
// Run via `bun run generate`. A `.tsp` / `.asyncapi.yaml` change that is NOT
// re-run through this command fails test/drift.test.ts (regenerate != committed).

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const servicePath = resolve(pkgRoot, '../../services/notify-service');
const openapiPath = resolve(servicePath, 'dist/openapi.yaml');
const sdkPublicGatewayBaseUrl = undefined;

function run(cmd, args, cwd) {
  console.log(`\n$ (${cwd}) ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(
      `\nFAILED: ${cmd} ${args.join(' ')} (exit ${r.status}).\n` +
        'Cause is either a contract change that does not compile, OR a ' +
        'generator-version drift. Run under the committed lockfile.',
    );
    process.exit(r.status ?? 1);
  }
}

function normalizeOpenapiServers() {
  const source = readFileSync(openapiPath, 'utf8');
  const servers = [
    ...(sdkPublicGatewayBaseUrl
      ? [
          '  - url: ' + sdkPublicGatewayBaseUrl,
          '    description: Gateway',
          '    variables:',
          '      host:',
          "        default: ''",
        ]
      : []),
    '  - url: http://localhost:3000',
    '    description: Local notify-service',
    '    variables: {}',
  ];
  const replacement = 'servers:\n' + servers.join('\n') + '\n';
  const next = source.replace(/\nservers:\n[\s\S]*$/u, '\n' + replacement);
  if (next === source) {
    throw new Error('cannot normalize OpenAPI servers: missing root servers block in ' + openapiPath);
  }
  writeFileSync(openapiPath, next);
}

// 1. service contract -> OpenAPI 3.1 (tsp compile specs/notify.tsp -> dist/openapi.yaml)
run('bun', ['run', 'spec:openapi'], servicePath);

// 1b. Close public SDK defaults over DOMAIN_ROUTE_MAP. If the gateway does not
// route a pass-through public domain for this service, strip the guessed public
// server so @hey-api emits a local-only baseUrl union instead of a public 404.
normalizeOpenapiServers();

// 2. OpenAPI -> typed REST client (config = openapi-ts.config.ts)
// Pin the exact version (matches the package.json devDep) so a fresh SDK regen
// never resolves bunx `@latest` (MODULE_NOT_FOUND / version-drift foot-gun).
run('bunx', ['@hey-api/openapi-ts@0.98.1'], pkgRoot);

// 3. AsyncAPI -> typed event wire-types
run('bun', ['scripts/gen-events.mjs'], pkgRoot);

// 4. Format the generated output with the repo's biome config. @hey-api emits
// long single-line `index.ts` re-exports that the pre-commit biome hook would
// otherwise rewrite - formatting here keeps the committed output == the hook
// output == a fresh regen, so test/drift.test.ts stays byte-stable. (`.gen.ts`
// is biome-ignored, so this only normalizes the emitted index files.)
run('bunx', ['biome', 'format', '--write', 'src'], pkgRoot);

console.log('\nnotify-sdk regenerated from contracts.');
