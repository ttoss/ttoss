/**
 * Toast — Feedback-entity transient report (ADR-040).
 *
 * Three things this suite exists to hold, all of them behaviour a rendered
 * queue can hide:
 *
 * 1. **The valence is not carried by colour alone** (WCAG 1.4.1). Each
 *    evaluation that makes an outcome claim renders its glyph; `primary`,
 *    the neutral voice, deliberately renders none.
 * 2. **The dismissal contract is the queue's, not the caller's.** A supplied
 *    timeout is a floor; an actionable toast never auto-dismisses.
 * 3. **Every part paints from `feedback.*`.** A control on a voiced fill that
 *    reached for `action.*` would arrive with the page's palette on top of a
 *    saturated red — and would break the entity/ux-context contract test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { axe } from 'jest-axe';
import {
  createToastQueue,
  type ToastContent,
  type ToastQueue,
  ToastRegion,
} from 'src/index';

const TIMEOUT_FLOOR = 5000;

const mountToast = (content: ToastContent, options?: { timeout?: number }) => {
  const queue: ToastQueue = createToastQueue({ maxVisibleToasts: 5 });
  queue.add(content, options);
  render(<ToastRegion queue={queue} />);
  return queue;
};

const part = (name: string) => {
  return document.querySelector<HTMLElement>(
    `[data-scope="toast"][data-part="${name}"]`
  );
};

describe('Toast — valence glyph (WCAG 1.4.1)', () => {
  test.each(['accent', 'positive', 'caution', 'negative'] as const)(
    'evaluation=%s renders a status glyph beside the title',
    (evaluation) => {
      mountToast({ title: 'Report', evaluation });
      const glyph = part('glyph');
      expect(glyph).not.toBeNull();
      expect(glyph?.querySelector('[data-scope="icon"]')).not.toBeNull();
    }
  );

  test('primary renders no glyph — it is the neutral voice, not an outcome', () => {
    mountToast({ title: 'Report' });
    expect(part('root')).toHaveAttribute('data-evaluation', 'primary');
    expect(part('glyph')).toBeNull();
  });

  test('the glyph is decorative — the title already carries the words', () => {
    mountToast({ title: 'Deploy failed', evaluation: 'negative' });
    expect(part('glyph')?.querySelector('[data-scope="icon"]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  test('the outcome valences do not all share one glyph', () => {
    // The point of the mark is that success and failure are told apart
    // without colour. Rendered together so the comparison is one DOM.
    const queue = createToastQueue({ maxVisibleToasts: 5 });
    queue.add({ title: 'a', evaluation: 'positive' });
    queue.add({ title: 'b', evaluation: 'negative' });
    queue.add({ title: 'c', evaluation: 'accent' });
    render(<ToastRegion queue={queue} />);

    const glyphs = Array.from(
      document.querySelectorAll('[data-part="glyph"] [data-scope="icon"]')
    ).map((el) => {
      return el.getAttribute('icon');
    });

    expect(glyphs).toHaveLength(3);
    expect(new Set(glyphs).size).toBe(3);
  });
});

describe('Toast — the dismissal contract', () => {
  test('a supplied timeout is a floor, not a value', () => {
    const queue = createToastQueue();
    queue.add({ title: 'x' }, { timeout: 1000 });
    expect(queue.visibleToasts[0]?.timeout).toBe(TIMEOUT_FLOOR);
  });

  test('a timeout above the floor is left alone', () => {
    const queue = createToastQueue();
    queue.add({ title: 'x' }, { timeout: 9000 });
    expect(queue.visibleToasts[0]?.timeout).toBe(9000);
  });

  test('no timeout still means "stays until dismissed" — the clamp never invents one', () => {
    const queue = createToastQueue();
    queue.add({ title: 'x' });
    expect(queue.visibleToasts[0]?.timeout).toBeUndefined();
  });

  test('an actionable toast never auto-dismisses, even when asked to', () => {
    // WCAG 2.2.1: an offer that expires on a timer cannot be taken. The queue
    // overrides the caller here rather than shipping a broken affordance.
    const queue = createToastQueue();
    queue.add({ title: 'x', actionLabel: 'Undo' }, { timeout: 9000 });
    expect(queue.visibleToasts[0]?.timeout).toBeUndefined();
  });

  test('other queue options survive the clamp', () => {
    const onClose = jest.fn();
    const queue = createToastQueue();
    queue.add({ title: 'x' }, { timeout: 10, onClose });
    expect(queue.visibleToasts[0]?.onClose).toBe(onClose);
    expect(queue.visibleToasts[0]?.timeout).toBe(TIMEOUT_FLOOR);
  });
});

describe('Toast — the action trigger', () => {
  test('no action is rendered unless a label is supplied', () => {
    mountToast({ title: 'Saved' });
    expect(part('actionTrigger')).toBeNull();
  });

  test('pressing the action runs the handler and dismisses by default', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    mountToast({ title: 'Message archived', actionLabel: 'Undo', onAction });

    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(part('root')).toBeNull();
  });

  test('shouldCloseOnAction=false keeps the toast narrating', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    mountToast({
      title: 'Retrying',
      actionLabel: 'Retry',
      onAction,
      shouldCloseOnAction: false,
    });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(part('root')).not.toBeNull();
  });

  test('a label without a handler still dismisses rather than dead-ending', async () => {
    const user = userEvent.setup();
    mountToast({ title: 'Archived', actionLabel: 'Undo' });

    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(part('root')).toBeNull();
  });

  test('the action sits outside the announced region', () => {
    // `role="alert"` is on the message. A live region should announce what
    // happened, not read a button label as part of the sentence.
    mountToast({
      title: 'Deploy failed',
      description: 'Check the build log.',
      actionLabel: 'Retry',
      evaluation: 'negative',
    });

    const message = part('message');
    expect(message).toHaveAttribute('role', 'alert');
    expect(message?.querySelector('[data-part="actionTrigger"]')).toBeNull();
    expect(part('content')?.contains(part('actionTrigger'))).toBe(true);
  });
});

describe('Toast — every part paints from the feedback palette', () => {
  test.each(['primary', 'accent', 'positive', 'caution', 'negative'] as const)(
    'evaluation=%s dresses the surface and its action with feedback tokens',
    (evaluation) => {
      mountToast({ title: 'Report', evaluation, actionLabel: 'Undo' });
      const colors = vars.colors.feedback[evaluation];

      expect(part('root')?.style.backgroundColor).toBe(
        colors.background!.default
      );
      // The action is an outline dressed by the surface's own ink — the
      // reference reaches the same silhouette through a static-colour escape.
      const action = part('actionTrigger');
      expect(action?.style.borderColor).toBe(colors.text!.default);
      expect(action?.style.color).toBe(colors.text!.default);
      expect(action?.style.background).toBe(colors.background!.default);
    }
  );

  test('the inset stays uniform — no step on the ladder lands it symmetric', () => {
    // F-058. The trailing edge reads 4.7px heavier than the leading one
    // because the close trigger carries its own inset; stepping the trailing
    // side down to `sm` overshoots by 7.3px. Measured, both ways, in
    // Chromium at 1280px — this asserts the choice so a future "obvious"
    // asymmetry has to re-measure before it lands.
    mountToast({ title: 'Report' });
    expect(part('root')?.style.padding).toBe(vars.spacing.inset.surface.md);
  });
});

describe('Toast — accessibility', () => {
  test('an actionable, described toast has no axe violations', async () => {
    // The canonical fixture the shared a11y suite runs is a bare toast; this
    // covers the shape that suite cannot reach — glyph, description and a
    // second focusable control on the same surface.
    jest.useRealTimers();
    mountToast({
      title: 'Deploy failed',
      description: 'Check the build log for details.',
      evaluation: 'negative',
      actionLabel: 'Retry',
    });

    const results = await axe(document.body);
    expect(results.violations).toEqual([]);
  }, 15000);

  test('the close trigger is named by React Aria, not by this package', () => {
    // ADR-001: fsl-ui ships no i18n runtime and puts no English on screen.
    // The close button is the exception that proves it — React Aria supplies
    // a localized `aria-label`, so no prop is needed and none is invented.
    mountToast({ title: 'Saved' });
    expect(part('closeTrigger')?.getAttribute('aria-label')).toBeTruthy();
  });
});
