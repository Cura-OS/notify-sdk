// Contract-drift guard (Epic #24 acceptance: "regenerates cleanly when the
// contract changes; regenerate == committed").
//
// Re-runs the SAME generation the package ships with (`bun run generate`) and
// asserts the committed src/ is byte-identical to a fresh regen. A change to
// notify.tsp / notify.asyncapi.yaml that was NOT re-run through `generate`, OR a
// generator-version bump that changes output, fails here — the committed SDK
// can never silently drift from the contract.

import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkgRoot = join(import.meta.dir, '..');
const srcDir = join(pkgRoot, 'src');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function snapshot(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const file of walk(srcDir)) {
    // index.ts is the hand-written public surface, not generated output.
    if (relative(srcDir, file) === 'index.ts') continue;
    map[relative(srcDir, file)] = readFileSync(file, 'utf8');
  }
  return map;
}

describe('contract-drift guard', () => {
  test('committed SDK == fresh regeneration from the contracts', () => {
    const before = snapshot();

    const result = spawnSync('bun', ['run', 'generate'], {
      cwd: pkgRoot,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);

    const after = snapshot();

    // Same set of generated files.
    expect(Object.keys(after).toSorted()).toEqual(Object.keys(before).toSorted());

    // Byte-identical contents. A mismatch means the committed output is stale
    // (contract changed without `bun run generate`) OR a generator version
    // drifted — run `bun run generate` under the committed lockfile and commit.
    for (const path of Object.keys(before)) {
      expect(after[path], `drift in ${path}`).toBe(before[path]);
    }
  });
});
