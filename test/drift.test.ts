// Contract-drift guard (regenerates cleanly when the contract changes;
// regenerate == committed).
//
// Re-runs the SAME generation the package ships with (`bun run generate`) and
// asserts the committed src/ is byte-identical to a fresh regen. A change to
// the .tsp / .asyncapi.yaml that was NOT re-run through `generate`, OR a
// generator-version bump that changes output, fails here - the committed SDK
// can never silently drift from the contract.

import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkgRoot = join(import.meta.dir, '..');
const srcDir = join(pkgRoot, 'src');
const lockDir = join(pkgRoot, '..', '.sdk-drift-generate.lock');
const serviceCandidates = [join(pkgRoot, '../../services/notify-service')];
const allowMissingService = process.env.CURAOS_SDK_DRIFT_ALLOW_MISSING_SERVICE === '1';

function readJson(path: string): Record<string, unknown> | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function hasSpecOpenapiScript(serviceDir: string): boolean {
  const pkg = readJson(join(serviceDir, 'package.json'));
  const scripts = pkg?.scripts;
  return Boolean(
    scripts && typeof scripts === 'object' && (scripts as Record<string, unknown>)['spec:openapi'],
  );
}

function contractRegenUnavailableReason(): string | undefined {
  const checkedOut = serviceCandidates.filter((serviceDir) =>
    existsSync(join(serviceDir, 'package.json')),
  );
  if (checkedOut.length === 0) {
    return `source service not checked out: ${serviceCandidates.join(', ')}`;
  }
  const missingScript = checkedOut.filter((serviceDir) => !hasSpecOpenapiScript(serviceDir));
  if (missingScript.length > 0) {
    return `source service missing spec:openapi: ${missingScript.join(', ')}`;
  }
  return undefined;
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function withGenerateLock<T>(fn: () => T): T {
  const deadline = Date.now() + 300_000;
  for (;;) {
    try {
      mkdirSync(lockDir);
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST' || Date.now() > deadline) {
        throw error;
      }
      sleep(100);
    }
  }

  try {
    return fn();
  } finally {
    rmSync(lockDir, { recursive: true, force: true });
  }
}

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
    const unavailableReason = contractRegenUnavailableReason();
    if (unavailableReason) {
      if (!allowMissingService || unavailableReason.includes('missing spec:openapi')) {
        throw new Error(
          `${unavailableReason}. Set CURAOS_SDK_DRIFT_ALLOW_MISSING_SERVICE=1 only in submodule-less CI coverage clones.`,
        );
      }
      console.warn(`contract-drift guard skipped: ${unavailableReason}`);
      return;
    }

    const before = snapshot();

    const result = withGenerateLock(() =>
      spawnSync('bun', ['run', 'generate'], {
        cwd: pkgRoot,
        encoding: 'utf8',
      }),
    );
    expect(
      result.status,
      [
        'bun run generate failed',
        result.error ? `error: ${result.error.message}` : '',
        result.stdout ? `stdout:\n${result.stdout}` : '',
        result.stderr ? `stderr:\n${result.stderr}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
    ).toBe(0);

    const after = snapshot();

    // Same set of generated files.
    expect(Object.keys(after).toSorted()).toEqual(Object.keys(before).toSorted());

    // Byte-identical contents. A mismatch means the committed output is stale
    // (contract changed without `bun run generate`) OR a generator version
    // drifted - run `bun run generate` under the committed lockfile and commit.
    for (const path of Object.keys(before)) {
      expect(after[path], `drift in ${path}`).toBe(before[path]);
    }
  }, 360_000);
});
