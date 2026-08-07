/**
 * llms.txt drift guard for @ttoss/fsl-ui.
 *
 * `llms.txt` is the LLM-facing usage contract shipped in the tarball. It is a
 * hand-authored mirror of registries the code owns, and the E1 consistency
 * sweep (2026-08-06) found every hand-maintained enumeration in it had
 * drifted — the catalog, the icon intents, the geometry knobs, the state
 * cascade. This guard pins those mirrors to their typed sources so the next
 * addition fails here instead of shipping stale. It checks membership and
 * order, not prose — the guide stays free to describe, it just may not
 * enumerate wrongly.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as index from '../../../src/index';
import { STATE_PRIORITY } from '../../../src/semantics/taxonomy';

const LLMS = readFileSync(join(__dirname, '../../../llms.txt'), 'utf8');
const LLMS_FLAT = LLMS.replace(/\s+/g, ' ');
const CONTRACT = readFileSync(
  join(__dirname, '../../../src/tokens/CONTRACT.md'),
  'utf8'
);

describe('llms.txt drift guard', () => {
  test('every component with a *Meta identity is named in llms.txt', () => {
    const metas = Object.entries(index).filter(([key]) => {
      return key.endsWith('Meta');
    });
    expect(metas.length).toBeGreaterThan(0);
    const missing = metas
      .map(([, meta]) => {
        return (meta as { name: string }).name;
      })
      .filter((name) => {
        return !LLMS.includes(name);
      });
    expect(missing).toEqual([]);
  });

  test('every ICON_INTENTS member is named in llms.txt', () => {
    const missing = index.ICON_INTENTS.filter((intent) => {
      return !LLMS.includes(intent);
    });
    expect(missing).toEqual([]);
  });

  test('llms.txt and CONTRACT §7 agree on the --fsl- knob registry', () => {
    const knobsOf = (text: string) => {
      return new Set(text.match(/--fsl-[a-z][a-z-]*[a-z]/g) ?? []);
    };
    const contractKnobs = knobsOf(CONTRACT);
    const llmsKnobs = knobsOf(LLMS);
    expect(contractKnobs.size).toBeGreaterThan(0);
    expect(
      [...contractKnobs].filter((k) => {
        return !llmsKnobs.has(k);
      })
    ).toEqual([]);
    expect(
      [...llmsKnobs].filter((k) => {
        return !contractKnobs.has(k);
      })
    ).toEqual([]);
  });

  test('the state cascade in llms.txt matches STATE_PRIORITY, in order', () => {
    const expected = [
      ...STATE_PRIORITY.map(({ flag }) => {
        const bare = flag.replace(/^is/, '');
        return bare.charAt(0).toLowerCase() + bare.slice(1);
      }),
      'default',
    ].join(' > ');
    expect(LLMS_FLAT).toContain(expected);
  });
});
