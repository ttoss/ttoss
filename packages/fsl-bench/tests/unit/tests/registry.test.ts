import fs from 'node:fs';
import path from 'node:path';

import {
  findPackageRoot,
  getLibrary,
  LIBRARIES,
  loadContext,
} from '../../../src/libraries.ts';
import { getScenario, SCENARIOS } from '../../../src/scenarios/index.ts';

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
