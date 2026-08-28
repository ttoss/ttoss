/**
 * The Disclosure-family anatomy contract (P3 review round 6).
 *
 * `Disclosure` and `Accordion` are two composites over one entity, and their
 * trigger/panel/container implementations were byte-for-byte copies under
 * two names before this round — the same class of duplication
 * `selectionControl.ts`/`rail.ts`/`Field/anatomy.tsx` already removed
 * elsewhere. These assertions pin the shared builders directly, the way
 * `rail.test.tsx` pins `rail.ts` rather than only exercising it through a
 * component.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import {
  buildDisclosureContainerStyle,
  buildDisclosureIndicatorStyle,
  buildDisclosurePanelBodyStyle,
  buildDisclosureTriggerStyle,
} from 'src/tokens/disclosureAnatomy';

describe('buildDisclosureContainerStyle', () => {
  test('reads the caller-supplied border colour', () => {
    expect(buildDisclosureContainerStyle('rgb(1,2,3)').borderColor).toBe(
      'rgb(1,2,3)'
    );
  });

  test('falls back to transparent when no colour resolves', () => {
    expect(buildDisclosureContainerStyle(undefined).borderColor).toBe(
      'transparent'
    );
  });
});

describe('buildDisclosureTriggerStyle', () => {
  const c = vars.colors.navigation.primary;

  test('resolves background/text through the state cascade', () => {
    const resting = buildDisclosureTriggerStyle({
      background: c?.background,
      text: c?.text,
      flags: {},
    });
    expect(resting.backgroundColor).toBe(c?.background?.default);
    expect(resting.color).toBe(c?.text?.default);
    expect(resting.cursor).toBe('pointer');
    expect(resting.opacity).toBeUndefined();
  });

  test('disabled state dims and blocks the cursor', () => {
    const disabled = buildDisclosureTriggerStyle({
      background: c?.background,
      text: c?.text,
      flags: { isDisabled: true },
    });
    expect(disabled.cursor).toBe('not-allowed');
    expect(disabled.opacity).toBe(vars.opacity.disabled);
  });

  test('text falls back to the resting ink when the state has none', () => {
    const style = buildDisclosureTriggerStyle({
      background: c?.background,
      text: undefined,
      flags: {},
    });
    expect(style.color).toBeUndefined();
  });
});

describe('buildDisclosureIndicatorStyle', () => {
  test('rotates open and uses the enter timing', () => {
    const open = buildDisclosureIndicatorStyle(true);
    expect(open.transform).toBe('rotate(90deg)');
    expect(open.transitionDuration).toBe(vars.motion.transition.enter.duration);
  });

  test('rests flat and uses the exit timing when closed', () => {
    const closed = buildDisclosureIndicatorStyle(false);
    expect(closed.transform).toBe('rotate(0deg)');
    expect(closed.transitionDuration).toBe(
      vars.motion.transition.exit.duration
    );
  });
});

describe('buildDisclosurePanelBodyStyle', () => {
  test('publishes the resting fill and paints the given ink', () => {
    const style = buildDisclosurePanelBodyStyle({
      background: 'rgb(4,5,6)',
      text: 'rgb(7,8,9)',
    });
    expect(style.backgroundColor).toBe('rgb(4,5,6)');
    expect(style.color).toBe('rgb(7,8,9)');
  });
});
