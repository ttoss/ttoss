/**
 * InlineAlert — the `status.passive` Feedback surface (ADR-043).
 *
 * What is worth asserting here is what the contract suite cannot see: that the
 * ground is never valenced, that the valence lives in the mark, and that the
 * live region is announced the one way that is correct in both arrangements.
 *
 * Not asserted, deliberately: hover/press. `feedback` admits
 * `default | focused | disabled` only (FSL §7) and this surface is not
 * operable — there is no pointer state to resolve.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Button, InlineAlert } from 'src/index';

const part = (name: string) => {
  return document.querySelector<HTMLElement>(
    `[data-scope="inline-alert"][data-part="${name}"]`
  );
};

const VALENCES = ['positive', 'caution', 'negative'] as const;
const EMPHASIS = ['primary', 'accent'] as const;

describe('InlineAlert — the ground is the page, the edge is the evaluation', () => {
  test.each([...EMPHASIS, ...VALENCES])(
    'evaluation=%s grounds on the quiet rung, never on a valence fill',
    (evaluation) => {
      // The posture in one assertion: a `negative` report is not a red box. The
      // ground is the quiet rung in every evaluation, and that rung resolves the
      // page's own colour (fsl-theme ADR-030) — § Stacking has a contained
      // surface share the page's background and pay separation elsewhere.
      render(<InlineAlert evaluation={evaluation}>Body</InlineAlert>);

      expect(part('root')?.style.backgroundColor).toBe(
        vars.colors.feedback.muted.background!.default
      );
      expect(part('root')?.style.backgroundColor).not.toBe(
        vars.colors.feedback[evaluation].background!.default
      );
    }
  );

  test.each([...EMPHASIS, ...VALENCES])(
    'evaluation=%s pays its separation in the edge',
    (evaluation) => {
      // Where § Stacking says it belongs: elevation first, border second, never
      // colour. Against a page-coloured ground this is Required Pairing #2, the
      // border-vs-adjacent-surface pair the theme audits for every role.
      render(<InlineAlert evaluation={evaluation}>Body</InlineAlert>);

      expect(part('root')?.style.borderColor).toBe(
        vars.colors.feedback[evaluation].border!.default
      );
    }
  );

  test('the neutral voice still reads as a box', () => {
    // `primary` colours nothing, but it is not edgeless: its own border is the
    // strong neutral the reference gives its neutral variant. A page-coloured
    // ground with no edge would be a ghost.
    render(<InlineAlert evaluation="primary">Body</InlineAlert>);

    expect(part('root')?.style.borderColor).toBe(
      vars.colors.feedback.primary.border!.default
    );
    expect(part('root')?.style.borderColor).not.toBe(
      part('root')?.style.backgroundColor
    );
  });

  test('it sits in the flow — no elevation of its own', () => {
    // `elevation: flat` is the §1 row's legal minimum, not the `raised` a Toast
    // takes: lifting a surface that is *in* the flow claims a depth it has not
    // got. The absence is the assertion.
    render(<InlineAlert>Body</InlineAlert>);
    expect(part('root')?.style.boxShadow).toBe('');
  });
});

describe('InlineAlert — the valence lives in the mark', () => {
  test.each(VALENCES)(
    'evaluation=%s inks the mark with its valence',
    (evaluation) => {
      render(<InlineAlert evaluation={evaluation}>Body</InlineAlert>);
      expect(part('status')?.style.color).toBe(vars.valence[evaluation].ink);
    }
  );

  test.each(VALENCES)(
    'evaluation=%s renders a glyph in the mark',
    (evaluation) => {
      render(<InlineAlert evaluation={evaluation}>Body</InlineAlert>);
      expect(
        part('status')?.querySelector('[data-scope="icon"]')
      ).not.toBeNull();
    }
  );

  test('primary carries no mark — the neutral voice claims no outcome', () => {
    render(<InlineAlert evaluation="primary">Body</InlineAlert>);
    expect(part('status')).toBeNull();
  });

  test('accent takes the glyph but keeps the prose ink', () => {
    // `accent` is an Emphasis role — FSL Lexicon §5, which owns the
    // classification — so it has no valence ink to take. The glyph still earns
    // its place: "note this" is a claim about attention, not about outcome, and
    // that is exactly the distinction the ink is withheld to preserve.
    render(<InlineAlert evaluation="accent">Body</InlineAlert>);
    const mark = part('status');

    expect(mark?.querySelector('[data-scope="icon"]')).not.toBeNull();
    expect(mark?.style.color).toBe(vars.colors.feedback.muted.text!.default);
  });

  test('the outcome valences do not all share one glyph', () => {
    // WCAG 1.4.1 on this surface rests on SHAPE first: the ground is neutral in
    // every evaluation, so if every glyph were the same picture the ink would be
    // the sole carrier. `caution` and `negative` share the triangle by a stated
    // decision; `positive` and `accent` must not join them.
    const { rerender } = render(
      <InlineAlert evaluation="positive">x</InlineAlert>
    );
    const seen = new Set<string | null>();

    for (const evaluation of ['positive', 'accent', 'negative'] as const) {
      rerender(<InlineAlert evaluation={evaluation}>x</InlineAlert>);
      seen.add(
        part('status')
          ?.querySelector('[data-scope="icon"]')
          ?.getAttribute('icon') ?? null
      );
    }

    expect(seen.size).toBe(3);
  });

  test('the mark is decorative — the body already carries the words', () => {
    render(<InlineAlert evaluation="negative">Sync failed</InlineAlert>);
    expect(
      part('status')?.querySelector('[data-scope="icon"]')
    ).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('InlineAlert — the title outranks the body', () => {
  // The defect this pins (F-064) was invisible to every existing suite: the
  // contract tests audit colour, not type, so a title typed from `label.md`
  // (16px/400) over a body typed from `body.md` (18px/400) shipped — smaller
  // AND no heavier than the prose it introduces. Measured in Chromium, not
  // inferred. jsdom resolves no `clamp()`, so the assertion is on the token
  // each part reads, which is the thing the component actually decides.
  test('the title reads the title family, never a label step', () => {
    render(<InlineAlert title="Sync failed">Body</InlineAlert>);
    expect(part('title')?.style.fontSize).toBe(vars.text.title.sm.fontSize);
    expect(part('title')?.style.fontSize).not.toBe(vars.text.label.md.fontSize);
  });

  test('the title is heavier than the body', () => {
    // The half a size step cannot carry on its own: every `label.*` step is
    // weight 400, which is why no member of that family could ever have worked
    // here. Contract invariant #16 keeps the row able to say this.
    render(<InlineAlert title="Sync failed">Body</InlineAlert>);
    expect(part('title')?.style.fontWeight).toBe(vars.text.title.sm.fontWeight);
    expect(part('body')?.style.fontWeight).toBe(vars.text.body.md.fontWeight);
    expect(part('title')?.style.fontWeight).not.toBe(
      part('body')?.style.fontWeight
    );
  });
});

describe('InlineAlert — announcement', () => {
  test('it is a polite live region', () => {
    render(<InlineAlert>Body</InlineAlert>);
    expect(part('root')).toHaveAttribute('role', 'status');
  });

  test('it does not also set aria-live', () => {
    // `role="status"` already implies `aria-live="polite"`; setting both
    // double-announces on some assistive technology. The absence is the rule.
    render(<InlineAlert>Body</InlineAlert>);
    expect(part('root')).not.toHaveAttribute('aria-live');
  });

  test('it does not name the region', () => {
    // A name on a live region competes with the content it is announcing, so
    // the title stays inside the region as text rather than becoming its label.
    render(<InlineAlert title="Sync failed">Body</InlineAlert>);
    expect(part('root')).not.toHaveAttribute('aria-labelledby');
    expect(part('root')).not.toHaveAttribute('aria-label');
  });

  test('the title is text, not a heading', () => {
    // Only the host knows the correct outline level; a wrong one is worse than
    // none. `Toast` sets the same precedent for a Feedback title.
    render(<InlineAlert title="Sync failed">Body</InlineAlert>);
    const title = part('title');

    expect(title?.tagName).toBe('SPAN');
    expect(title).not.toHaveAttribute('role', 'heading');
  });
});

describe('InlineAlert — anatomy', () => {
  test('the body is the required part; title and actions are optional', () => {
    // `<InlineAlert />` and `<InlineAlert title="x" />` are **compile errors** —
    // `children` is required, which is the whole of the rule "a title needs a
    // body". That is the assertion, and TypeScript is the only thing that can
    // make it; this case pins the runtime half, that a bodied report needs
    // nothing else.
    render(<InlineAlert>Two fields still need attention.</InlineAlert>);

    expect(part('root')).not.toBeNull();
    expect(part('body')?.textContent).toBe('Two fields still need attention.');
    expect(part('title')).toBeNull();
    expect(part('actions')).toBeNull();
  });

  test('it renders the copy it is given', () => {
    render(<InlineAlert title="Read-only mode">Until 22:00.</InlineAlert>);

    expect(part('title')?.textContent).toBe('Read-only mode');
    expect(part('body')?.textContent).toBe('Until 22:00.');
  });

  test('the action slot hosts an ordinary Action component', () => {
    // This is the payoff of a neutral ground: no cross-ux read, no re-dressed
    // trigger. A quiet surface is exactly where the page's palette is correct —
    // the inverse of the argument ADR-040 makes for a toast's own triggers.
    render(
      <InlineAlert
        evaluation="negative"
        actions={<Button evaluation="primary">Retry</Button>}
      >
        Body
      </InlineAlert>
    );

    const action = part('actions');
    expect(action).not.toBeNull();
    expect(
      action?.querySelector('[data-scope="button"][data-part="root"]')
    ).not.toBeNull();
  });

  test('forwarded props reach the root without displacing the contract ones', () => {
    render(
      <InlineAlert id="sync" data-testid="alert">
        Body
      </InlineAlert>
    );
    const root = part('root');

    expect(root).toHaveAttribute('id', 'sync');
    expect(root).toHaveAttribute('data-testid', 'alert');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('data-evaluation', 'primary');
  });
});
