import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  findPackageRoot,
  getLibrary,
  LIBRARIES,
  loadContext,
} from '../../../src/libraries.ts';
import { getScenario, SCENARIOS } from '../../../src/scenarios/index.ts';

/**
 * sha256 of each frozen prompt's text. This pins the README "frozen prompt
 * suite" rule as enforcement, not prose: any edit to a prompt's wording (or
 * to the suite membership) fails here. Cross-campaign comparability requires
 * the prompts not to drift silently — a deliberate change is a suite-version
 * bump, updated here and recorded in README, never a quiet edit.
 */
const FROZEN_PROMPT_HASHES: Record<string, string> = {
  dialog: '0b27b87233f62c131ad7d591940d2002ce14b3d7c27e3d26eb48f7e1a0f2566f',
  'field-validation':
    '57a710c17559a6d6bdceba8c54460f36689c1ca2f73630fc25595548b010a32f',
  menu: '5f8188d66c5429959e7238a332dca0b3f72624b8e71f8f4299dc53baf8e026d0',
  'destructive-confirm':
    '99e51af2f82d9b7ebc715255fae747f440c5a7794c5d209994a025737d195e1d',
  'themed-composite':
    '1be05df11c38c2aef690b5c59ec422d20ae3497467045f363dd60bb54777e70c',
};

describe('scenario suite (FROZEN)', () => {
  test('is exactly the D1 fixed prompt suite, in order', () => {
    expect(
      SCENARIOS.map((scenario) => {
        return scenario.id;
      })
    ).toEqual([
      'dialog',
      'field-validation',
      'menu',
      'destructive-confirm',
      'themed-composite',
    ]);
  });

  test('every prompt text matches its frozen sha256 (no silent drift)', () => {
    const actual = Object.fromEntries(
      SCENARIOS.map((scenario) => {
        return [
          scenario.id,
          crypto.createHash('sha256').update(scenario.prompt).digest('hex'),
        ];
      })
    );

    // Deliberate prompt change → update FROZEN_PROMPT_HASHES here AND bump
    // the suite version in README (comparability across campaigns).
    expect(actual).toEqual(FROZEN_PROMPT_HASHES);
  });

  test('every prompt is library-neutral (names no library or package)', () => {
    for (const scenario of SCENARIOS) {
      expect(scenario.prompt).not.toMatch(
        /fsl-ui|fsl-theme|radix|react-aria|@mui|material/i
      );
    }
  });

  test('getScenario throws on unknown ids', () => {
    expect(() => {
      return getScenario('nope' as never);
    }).toThrow('Unknown scenario');
  });
});

describe('library conditions', () => {
  test('cover the recorded cohort design', () => {
    const byCohort = Object.groupBy(LIBRARIES, (library) => {
      return library.cohort;
    });

    expect(
      byCohort.candidate?.map((library) => {
        return library.id;
      })
    ).toEqual(['fsl-ui', 'fsl-ui-bare']);
    expect(
      byCohort.baseline?.map((library) => {
        return library.id;
      })
    ).toEqual(['react-aria', 'radix']);
    expect(
      byCohort.control?.map((library) => {
        return library.id;
      })
    ).toEqual(['mui']);
  });

  test('every context file exists and is non-trivial', () => {
    for (const library of LIBRARIES) {
      const context = loadContext(library);
      expect(context.length).toBeGreaterThan(500);
    }
  });

  test('the full fsl-ui condition reads the SHIPPED llms.txt', () => {
    const library = getLibrary('fsl-ui');
    expect(library.contextFile).toBe('../fsl-ui/llms.txt');

    const shipped = fs.readFileSync(
      path.resolve(findPackageRoot(), '../fsl-ui/llms.txt'),
      'utf8'
    );
    expect(loadContext(library)).toBe(shipped);
  });

  test('getLibrary throws on unknown ids', () => {
    expect(() => {
      return getLibrary('nope' as never);
    }).toThrow('Unknown library');
  });
});
