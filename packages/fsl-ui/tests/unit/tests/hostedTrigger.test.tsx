/**
 * The hosted-trigger contract (C-09, Toast half).
 *
 * A hosted trigger is a control dressed by the host surface it sits on,
 * because that host cannot read `action.*` — the entity → ux-context
 * alignment binds a file's colour reads to the entities it declares, and a
 * `Toast` declares Feedback only. `Toast` hosts two of them and hand-rolled
 * the identical skeleton around each one's differences; the consolidation
 * moved the skeleton into `buildHostedTriggerStyle` and left the colours at
 * the caller.
 *
 * As with `rail.test.tsx`, the assertions run from both sides: the skeleton
 * is one decision (shared box, control radius, cursor/disabled affordance,
 * floated focus ring), and the axes that genuinely differ — the two postures'
 * boxes, and every colour — stay the caller's rather than being normalized
 * into the builder. A builder that resolved a colour itself would fail the
 * pass-through assertions with any sentinel.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { createToastQueue, ToastRegion } from 'src/index';
import { FOCUS_RING_OFFSET, focusRingOutline } from 'src/tokens/focusRing';
import { buildHostedTriggerStyle } from 'src/tokens/hostedTrigger';

// Sentinels no token resolves to — pass-through is the claim under test.
const INK = 'sentinel-ink';
const FILL = 'sentinel-fill';

const part = (name: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    `[data-scope="toast"][data-part="${name}"]`
  );
  if (!el) throw new Error(`not rendered: ${name}`);
  return el;
};

describe('hosted trigger — one skeleton across both postures', () => {
  test.each(['icon', 'outlined'] as const)(
    'posture=%s shares the box, radius, cursor and floated ring',
    (posture) => {
      const style = buildHostedTriggerStyle({
        posture,
        background: FILL,
        ink: INK,
      });

      expect(style.boxSizing).toBe('border-box');
      expect(style.display).toBe('inline-flex');
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      // A control's radius, not the host surface's.
      expect(style.borderRadius).toBe(vars.radii.control);
      expect(style.cursor).toBe('pointer');
      expect(style.opacity).toBeUndefined();
      expect(style.outline).toBe('none');
      expect(style.outlineOffset).toBe(FOCUS_RING_OFFSET);
    }
  );

  test.each(['icon', 'outlined'] as const)(
    'posture=%s: disabled swaps the cursor and dims',
    (posture) => {
      const style = buildHostedTriggerStyle({
        posture,
        background: FILL,
        ink: INK,
        isDisabled: true,
      });

      expect(style.cursor).toBe('not-allowed');
      expect(style.opacity).toBe(vars.opacity.disabled);
    }
  );

  test.each(['icon', 'outlined'] as const)(
    'posture=%s: keyboard focus shows the cross-cutting ring, floated',
    (posture) => {
      const style = buildHostedTriggerStyle({
        posture,
        background: FILL,
        ink: INK,
        isFocusVisible: true,
      });

      expect(style.outline).toBe(focusRingOutline(true));
      expect(style.outlineOffset).toBe(FOCUS_RING_OFFSET);
    }
  );
});

describe('hosted trigger — colours stay caller-supplied', () => {
  test('both postures pass the fill and ink through untouched', () => {
    for (const posture of ['icon', 'outlined'] as const) {
      const style = buildHostedTriggerStyle({
        posture,
        background: FILL,
        ink: INK,
      });
      expect(style.background).toBe(FILL);
      expect(style.color).toBe(INK);
    }
  });

  test('the outlined edge is the ink — one voice for edge and label', () => {
    const style = buildHostedTriggerStyle({
      posture: 'outlined',
      background: FILL,
      ink: INK,
    });
    expect(style.borderColor).toBe(INK);
  });

  test('an undefined fill emits nothing — the caller owns any fallback', () => {
    const style = buildHostedTriggerStyle({
      posture: 'outlined',
      background: undefined,
      ink: INK,
    });
    expect(style.background).toBeUndefined();
  });
});

describe('hosted trigger — the two postures differ only on the axes they own', () => {
  test('icon: a fixed glyph square with no edge and no typography', () => {
    const style = buildHostedTriggerStyle({
      posture: 'icon',
      background: FILL,
      ink: INK,
    });

    expect(style.width).toBe(vars.sizing.icon.lg);
    expect(style.height).toBe(vars.sizing.icon.lg);
    expect(style.flexShrink).toBe(0);
    expect(style.padding).toBe(0);
    // The host surface already draws the boundary; a glyph box adds none.
    expect(style.border).toBe('none');
    expect(style.borderColor).toBeUndefined();
    // It renders no text, so it declares no type.
    expect(style.fontSize).toBeUndefined();
  });

  test('outlined: an ink-edged command set in the action rhythm', () => {
    const style = buildHostedTriggerStyle({
      posture: 'outlined',
      background: FILL,
      ink: INK,
    });

    expect(style.alignSelf).toBe('flex-start');
    expect(style.paddingBlock).toBe(vars.spacing.inset.control.sm);
    expect(style.paddingInline).toBe(vars.spacing.inset.control.md);
    expect(style.borderWidth).toBe(vars.border.outline.control.width);
    expect(style.borderStyle).toBe(vars.border.outline.control.style);
    // `text.action.md` (semibold), not the title's `label.md` — the
    // weight-contrast rhythm for command triggers.
    const actionMd = vars.text.action.md as { fontSize?: string };
    expect(style.fontSize).toBe(actionMd.fontSize);
    // And none of the icon posture's fixed box.
    expect(style.width).toBeUndefined();
    expect(style.height).toBeUndefined();
  });
});

describe("hosted trigger — Toast's two triggers wear it, dressed by the toast", () => {
  test('close trigger is the icon posture in the feedback palette', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Deploy failed', evaluation: 'negative' });
    render(<ToastRegion queue={queue} />);

    const close = part('closeTrigger');
    expect(close.style.width).toBe(vars.sizing.icon.lg);
    expect(close.style.borderRadius).toBe(vars.radii.control);
    // Colours come from the host's subtree — `feedback.*`, never `action.*`.
    const ink = vars.colors.feedback.negative.text!.default;
    expect(close.style.color).toBe(ink);
    expect(close.style.color).not.toBe(
      vars.colors.action.primary!.text!.default
    );
  });

  test('action trigger is the outlined posture, its edge the host ink', () => {
    const queue = createToastQueue();
    queue.add({
      title: 'Message archived',
      actionLabel: 'Undo',
      evaluation: 'negative',
    });
    render(<ToastRegion queue={queue} />);

    const action = part('actionTrigger');
    const ink = vars.colors.feedback.negative.text!.default;
    expect(action.style.borderColor).toBe(ink);
    expect(action.style.color).toBe(ink);
    expect(action.style.borderWidth).toBe(vars.border.outline.control.width);
    // The interior resolves to the toast's own fill through the cascade —
    // never a literal `transparent` (the F-024 shape).
    expect(action.style.background).toBe(
      vars.colors.feedback.negative.background!.default
    );
  });
});
