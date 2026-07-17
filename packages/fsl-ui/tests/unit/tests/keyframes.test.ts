/**
 * Keyframes registry — invariant #8 of the component contract:
 * every `animation:` name referenced in `src/` must resolve to a real
 * `@keyframes` definition, and reduced-motion must disable it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  ANIMATION_NAMES,
  ensureKeyframes,
  KEYFRAMES_CSS,
} from 'src/tokens/keyframes';

const SOURCE_ROOT = resolve(__dirname, '../../../src');

const listSourceFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (/\.tsx?$/.test(entry) && !entry.endsWith('keyframes.ts')) {
      files.push(full);
    }
  }
  return files;
};

describe('contract invariant #8: animation names ↔ @keyframes', () => {
  test('every registered animation name has a matching @keyframes block', () => {
    for (const name of Object.values(ANIMATION_NAMES)) {
      expect(KEYFRAMES_CSS).toContain(`@keyframes ${name}`);
    }
  });

  test('every `animation:` in src/ references ANIMATION_NAMES (no bare names)', () => {
    // A bare string animation name would bypass the registry and silently
    // reference a keyframe that may not exist — the exact bug this
    // invariant was written against (dead indeterminate ProgressBar).
    const offenders: string[] = [];
    for (const file of listSourceFiles(SOURCE_ROOT)) {
      const source = readFileSync(file, 'utf8');
      // Inspect the full expression following each `animation:` key (the
      // formatter may wrap it across lines) — legal forms reference
      // ANIMATION_NAMES or reset with 'none' / undefined.
      const matches = source.matchAll(/\banimation:\s*([\s\S]{0,200}?),\s*\n/g);
      for (const m of matches) {
        const expression = m[1] ?? '';
        if (
          !expression.includes('ANIMATION_NAMES.') &&
          !/^(undefined|'none')/.test(expression.trim())
        ) {
          offenders.push(`${file}: animation: ${expression.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test('stylesheet disables animations under prefers-reduced-motion', () => {
    expect(KEYFRAMES_CSS).toContain('prefers-reduced-motion: reduce');
    expect(KEYFRAMES_CSS).toContain('animation: none !important');
  });
});

describe('ensureKeyframes injection', () => {
  test('injects the stylesheet once and is idempotent', () => {
    ensureKeyframes();
    ensureKeyframes();
    const styles = document.querySelectorAll('#fsl-ui-keyframes');
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe(KEYFRAMES_CSS);
  });

  test('does not duplicate an element injected by another module copy', () => {
    // Simulate a second copy of the package: fresh module state, but the
    // document already carries the style element from the first copy.
    ensureKeyframes();
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fresh = require('src/tokens/keyframes') as {
        ensureKeyframes: () => void;
      };
      fresh.ensureKeyframes();
    });
    expect(document.querySelectorAll('#fsl-ui-keyframes')).toHaveLength(1);
  });
});
