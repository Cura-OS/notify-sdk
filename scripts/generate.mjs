// One-command contract → SDK regeneration (the contract-drift guard's regen
// step). Establishes the reusable recipe for the sibling SDK lanes (#279-284):
//
//   1. compile the service TypeSpec contract -> OpenAPI 3.1 (spec:openapi)
//   2. @hey-api/openapi-ts: OpenAPI -> typed REST client (src/rest)
//   3. gen-events.mjs: AsyncAPI -> typed event wire-types (src/events.gen.ts)
//
// Run via `bun run generate`. A `.tsp` / `.asyncapi.yaml` change that is NOT
// re-run through this command fails test/drift.test.ts (regenerate != committed).

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const servicePath = resolve(pkgRoot, '../../services/notify-service');

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

// 1. service contract -> OpenAPI 3.1 (tsp compile specs/notify.tsp -> dist/openapi.yaml)
run('bun', ['run', 'spec:openapi'], servicePath);

// 2. OpenAPI -> typed REST client (config = openapi-ts.config.ts)
run('bunx', ['@hey-api/openapi-ts'], pkgRoot);

// 3. AsyncAPI -> typed event wire-types
run('bun', ['scripts/gen-events.mjs'], pkgRoot);

// 4. Format the generated output with the repo's biome config. @hey-api emits
// long single-line `index.ts` re-exports that the pre-commit biome hook would
// otherwise rewrite - formatting here keeps the committed output == the hook
// output == a fresh regen, so test/drift.test.ts stays byte-stable. (`.gen.ts`
// is biome-ignored, so this only normalizes the emitted index files.)
run('bunx', ['biome', 'format', '--write', 'src'], pkgRoot);

console.log('\nnotify-sdk regenerated from contracts.');
