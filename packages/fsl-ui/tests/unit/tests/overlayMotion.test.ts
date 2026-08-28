/**
 * The overlay-motion contract (E2 consolidation).
 *
 * `DialogModal` and `Drawer` each carried a private copy of the phase
 * resolver and the scrim, kept in step only by a "mirrors" comment. These
 * assertions pin the shared builders directly, the way
 * `disclosureAnatomy.test.tsx` pins its anatomy module.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import {
  buildScrimStyle,
  resolveTransitionPhase,
  surfacePhaseTransition,
} from 'src/tokens/overlayMotion';

describe('resolveTransitionPhase', () => {
  test('entering reads the enter spec', () => {
    expect(resolveTransitionPhase({ isEntering: true })).toBe(
      vars.motion.transition.enter
    );
  });

  test('exiting reads the exit spec', () => {
    expect(resolveTransitionPhase({ isExiting: true })).toBe(
      vars.motion.transition.exit
    );
  });

  test('entering wins when both flags are set', () => {
    expect(resolveTransitionPhase({ isEntering: true, isExiting: true })).toBe(
      vars.motion.transition.enter
    );
  });

  test('rest resolves to null', () => {
    expect(resolveTransitionPhase({})).toBeNull();
  });
});

describe('surfacePhaseTransition', () => {
  test('transform and opacity travel together on the phase timing', () => {
    expect(surfacePhaseTransition({ duration: '1s', easing: 'ease' })).toBe(
      'transform 1s ease, opacity 1s ease'
    );
  });

  test('no transition at rest', () => {
    expect(surfacePhaseTransition(null)).toBeUndefined();
  });
});

describe('buildScrimStyle', () => {
  test('blocks and dims, taking only the flex axes from the caller', () => {
    const style = buildScrimStyle({
      surfacePlacement: { alignItems: 'center', justifyContent: 'center' },
    });
    expect(style.position).toBe('fixed');
    expect(style.inset).toBe(0);
    expect(style.zIndex).toBe(vars.zIndex.layer.blocking);
    expect(style.backgroundColor).toBe(vars.overlay.scrim);
    expect(style.alignItems).toBe('center');
    expect(style.justifyContent).toBe('center');
    expect(style.opacity).toBe(1);
    expect(style.transition).toBeUndefined();
  });

  test('fades out on exit with the exit timing', () => {
    const exit = vars.motion.transition.exit;
    const style = buildScrimStyle({ isExiting: true, surfacePlacement: {} });
    expect(style.opacity).toBe(0);
    expect(style.transition).toBe(`opacity ${exit.duration} ${exit.easing}`);
  });
});
