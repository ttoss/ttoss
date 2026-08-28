/**
 * The occluding-boundary contract (CONTRACT §3.5, F-044) and the anchored
 * inset step (F-045).
 *
 * Both halves need a guard for the same reason: the defect they fix was
 * **invisible to every existing test**. An overlay whose edge is a hairline
 * still renders, still passes its geometry assertions, and still looks fine
 * with a shadow — it only fails a user who has shadows suppressed, or a
 * measurement nobody was taking. So these assertions pin *which token* each
 * surface reads, not how it looks.
 *
 * The discriminant is asserted from both sides: an occluding surface takes the
 * boundary, an **embedded** one keeps the role's hairline. Without the second
 * half, "make everything use the boundary" would pass — and that is the
 * theme-wide retune this contract exists to avoid.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import {
  Box,
  Button,
  createToastQueue,
  Dialog,
  DialogModal,
  DialogTrigger,
  Drawer,
  GridList,
  GridListItem,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverTrigger,
  Surface,
  ToastRegion,
  Tooltip,
  TooltipTrigger,
} from 'src/index';
import {
  buildOccludingSurfaceStyle,
  OCCLUDING_OUTLINE,
} from 'src/tokens/occludingSurface';
import { SURFACE_VAR } from 'src/tokens/surfaceScope';

const at = (selector: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`not rendered: ${selector}`);
  return el;
};

describe('occluding boundary — the token', () => {
  test('is the cross-cutting overlay outline, not a role edge', () => {
    expect(OCCLUDING_OUTLINE).toBe(vars.overlay.outline);
    // A role edge would put the boundary back on the hairline that measured
    // 1.31:1 against the page.
    expect(OCCLUDING_OUTLINE).not.toBe(
      vars.colors.informational.primary.border?.default
    );
  });
});

describe('occluding boundary — every surface that covers content reads it', () => {
  test('Menu popover', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>Open</Button>
        <Menu>
          <MenuItem>Rename</MenuItem>
        </Menu>
      </MenuTrigger>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(at('[data-scope="menu"][data-part="root"]').style.borderColor).toBe(
      OCCLUDING_OUTLINE
    );
  });

  test('Popover', async () => {
    const user = userEvent.setup();
    render(
      <PopoverTrigger>
        <Button>Open</Button>
        <Popover aria-label="Details">Body</Popover>
      </PopoverTrigger>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(
      at('[data-scope="popover"][data-part="root"]').style.borderColor
    ).toBe(OCCLUDING_OUTLINE);
  });

  test('Tooltip', async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger delay={0}>
        <Button>Copy</Button>
        <Tooltip>Copy a link</Tooltip>
      </TooltipTrigger>
    );
    await user.hover(screen.getByRole('button', { name: 'Copy' }));

    expect(
      at('[data-scope="tooltip"][data-part="root"]').style.borderColor
    ).toBe(OCCLUDING_OUTLINE);
  });

  test('Dialog panel', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <DialogModal>
          <Dialog aria-label="Confirm">Body</Dialog>
        </DialogModal>
      </DialogTrigger>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(
      at('[data-scope="dialog"][data-part="surface"]').style.borderColor
    ).toBe(OCCLUDING_OUTLINE);
  });

  test('Drawer panel', () => {
    render(
      <Drawer aria-label="Filters" isOpen>
        Body
      </Drawer>
    );

    expect(
      at('[data-scope="drawer"][data-part="surface"]').style.borderColor
    ).toBe(OCCLUDING_OUTLINE);
  });

  test('Toast root — the sixth occluder, on the raised stratum', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Saved' });
    render(<ToastRegion queue={queue} />);

    const root = at('[data-scope="toast"][data-part="root"]');
    expect(root.style.borderColor).toBe(OCCLUDING_OUTLINE);
    // The one elevation the sextet does not share: a toast lifts off the
    // page plane without covering a specific spot.
    expect(root.style.boxShadow).toBe(vars.elevation.surface.raised);
    expect(root.style.boxShadow).not.toBe(vars.elevation.surface.overlay);
  });
});

describe('occluding boundary — an embedded surface keeps the hairline', () => {
  // The other half of the discriminant. A card sits *in* the flow: losing its
  // edge loses decoration, not the information about where covered content
  // resumes, so it is not this contract's business.
  test('Surface', () => {
    render(<Surface level="raised">card</Surface>);
    const el = at('[data-scope="surface"][data-part="root"]');

    expect(el.style.borderColor).not.toBe(OCCLUDING_OUTLINE);
  });

  test('Box', () => {
    render(<Box border="muted">panel</Box>);
    const el = at('[data-scope="box"][data-part="root"]');

    expect(el.style.borderColor).toBe(
      vars.colors.informational.muted.border?.default
    );
    expect(el.style.borderColor).not.toBe(OCCLUDING_OUTLINE);
  });
});

describe('the anchored inset step — a gutter beside rows, not a page margin', () => {
  test('Menu content frames its rows at the anchored step', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>Open</Button>
        <Menu>
          <MenuItem>Rename</MenuItem>
        </Menu>
      </MenuTrigger>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(at('[data-scope="menu"][data-part="content"]').style.padding).toBe(
      vars.spacing.inset.surface.xs
    );
  });

  test('ListBox and GridList roots take the same step', () => {
    const { unmount } = render(
      <ListBox aria-label="Frameworks">
        <ListBoxItem id="react">React</ListBoxItem>
      </ListBox>
    );
    expect(at('[data-scope="list-box"][data-part="root"]').style.padding).toBe(
      vars.spacing.inset.surface.xs
    );
    unmount();

    render(
      <GridList aria-label="Files">
        <GridListItem id="a" textValue="Report">
          Report
        </GridListItem>
      </GridList>
    );
    expect(at('[data-scope="grid-list"][data-part="root"]').style.padding).toBe(
      vars.spacing.inset.surface.xs
    );
  });

  test('Tooltip pads uniformly at the anchored step', async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger delay={0}>
        <Button>Copy</Button>
        <Tooltip>Copy a link</Tooltip>
      </TooltipTrigger>
    );
    await user.hover(screen.getByRole('button', { name: 'Copy' }));

    // Uniform, which is the shape the reference gives every anchored surface,
    // and inside Overlay's own §1 scale rather than borrowing `inset.control`.
    expect(at('[data-scope="tooltip"][data-part="root"]').style.padding).toBe(
      vars.spacing.inset.surface.xs
    );
  });

  test('a Dialog keeps the page-surface step — it frames content, not rows', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <DialogModal>
          <Dialog aria-label="Confirm">Body</Dialog>
        </DialogModal>
      </DialogTrigger>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(at('[data-scope="dialog"][data-part="root"]').style.padding).toBe(
      vars.spacing.inset.surface.md
    );
  });
});

/**
 * The chrome half of the contract (C-02). Six surfaces assembled the same
 * radii + boundary + shadow + fill + outline by hand; E2 moved the assembly
 * into `buildOccludingSurfaceStyle` and left each caller only the axes it
 * genuinely owns. As with `rail.test.tsx`, the assertions run from both
 * sides: the shared chrome is read, and the parametrized axes (elevation,
 * publish rule, corners) stay different rather than normalized.
 */
describe('the occluding chrome is one builder, parametrized on the axes that differ (C-02)', () => {
  const primary = vars.colors.informational.primary;

  test('the shared chrome: surface radius, boundary edge, suppressed UA outline', () => {
    const style = buildOccludingSurfaceStyle({
      evaluation: 'primary',
      colors: primary,
      elevation: 'overlay',
      fill: 'voiced',
    }) as Record<string, unknown>;

    expect(style.borderRadius).toBe(vars.radii.surface);
    expect(style.borderWidth).toBe(vars.border.outline.surface.width);
    expect(style.borderStyle).toBe(vars.border.outline.surface.style);
    expect(style.borderColor).toBe(OCCLUDING_OUTLINE);
    expect(style.boxShadow).toBe(vars.elevation.surface.overlay);
    expect(style.outline).toBe('none');
  });

  test('voiced fill: the page-like primary voice publishes the surface', () => {
    const style = buildOccludingSurfaceStyle({
      evaluation: 'primary',
      colors: primary,
      elevation: 'overlay',
      fill: 'voiced',
    }) as Record<string, unknown>;

    expect(style.backgroundColor).toBe(primary.background?.default);
    expect(style[SURFACE_VAR]).toBe(primary.background?.default);
  });

  test('voiced fill: a non-primary voice keeps its voice', () => {
    const muted = vars.colors.informational.muted;
    const style = buildOccludingSurfaceStyle({
      evaluation: 'muted',
      colors: muted,
      elevation: 'overlay',
      fill: 'voiced',
    }) as Record<string, unknown>;

    expect(style.backgroundColor).toBe(muted.background?.default);
    expect(SURFACE_VAR in style).toBe(false);
  });

  test('plain fill never publishes — even at the default primary voice', () => {
    const style = buildOccludingSurfaceStyle({
      colors: primary,
      elevation: 'overlay',
      fill: 'plain',
    }) as Record<string, unknown>;

    expect(style.backgroundColor).toBe(primary.background?.default);
    expect(SURFACE_VAR in style).toBe(false);
  });

  test("elevation is the caller's stratum — raised is Toast's, not a default", () => {
    const raised = buildOccludingSurfaceStyle({
      colors: vars.colors.feedback.primary,
      elevation: 'raised',
      fill: 'plain',
    });

    expect(raised.boxShadow).toBe(vars.elevation.surface.raised);
    expect(raised.boxShadow).not.toBe(vars.elevation.surface.overlay);
  });

  test('the corners slice replaces the uniform radius — the shorthand is never emitted beside the longhands', () => {
    const style = buildOccludingSurfaceStyle({
      evaluation: 'primary',
      colors: primary,
      elevation: 'overlay',
      fill: 'voiced',
      corners: {
        borderStartStartRadius: 0,
        borderStartEndRadius: vars.radii.surface,
      },
    }) as Record<string, unknown>;

    expect('borderRadius' in style).toBe(false);
    expect(style.borderStartStartRadius).toBe(0);
    expect(style.borderStartEndRadius).toBe(vars.radii.surface);
  });

  test('an unresolved subtree emits no fill, under either fill rule', () => {
    const voiced = buildOccludingSurfaceStyle({
      colors: undefined,
      elevation: 'overlay',
      fill: 'voiced',
    }) as Record<string, unknown>;
    expect('backgroundColor' in voiced).toBe(false);
    expect(SURFACE_VAR in voiced).toBe(false);

    const plain = buildOccludingSurfaceStyle({
      colors: {},
      elevation: 'overlay',
      fill: 'plain',
    });
    expect(plain.backgroundColor).toBeUndefined();
  });
});

/**
 * The publish discriminant, pinned in the rendered DOM so it cannot silently
 * flip inside a caller. `Tooltip` is the one anchored occluder whose primary
 * voice does not publish `--fsl-surface` (owner ruling pending — a tooltip
 * hosts nothing today); `Toast` never publishes because a Feedback fill is a
 * voice at every evaluation. Both sides: `Popover` at the same default
 * `primary` voice does publish.
 */
describe('which occluders publish the surface they paint', () => {
  // Rendered separately: an open Popover hides everything outside itself
  // from the accessibility tree, so the three cannot share one DOM.
  test('Popover at the same default primary voice publishes', async () => {
    const user = userEvent.setup();
    render(
      <PopoverTrigger>
        <Button>Open</Button>
        <Popover aria-label="Details">Body</Popover>
      </PopoverTrigger>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    const popover = at('[data-scope="popover"][data-part="root"]');
    expect(popover.style.getPropertyValue(SURFACE_VAR)).toBe(
      vars.colors.informational.primary.background!.default
    );
  });

  test('Tooltip (primary) does not publish — the pending-ruling occluder', async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger delay={0}>
        <Button>Copy</Button>
        <Tooltip>Copy a link</Tooltip>
      </TooltipTrigger>
    );
    await user.hover(screen.getByRole('button', { name: 'Copy' }));

    const tooltip = at('[data-scope="tooltip"][data-part="root"]');
    expect(tooltip.style.getPropertyValue(SURFACE_VAR)).toBe('');
    // The no-publish voice still paints — plain is a fill rule, not "no fill".
    expect(tooltip.style.backgroundColor).toBe(
      vars.colors.informational.primary.background!.default
    );
    // And the tooltip declares no `outline` of its own — it is never a focus
    // target, and it declared none before the chrome was shared.
    expect(tooltip.style.outline).toBe('');
  });

  test('Toast never publishes — a Feedback fill is a voice at every evaluation', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Saved' });
    render(<ToastRegion queue={queue} />);

    const toast = at('[data-scope="toast"][data-part="root"]');
    expect(toast.style.getPropertyValue(SURFACE_VAR)).toBe('');
  });
});

describe('Dialog holds a floor as well as a ceiling (F-046)', () => {
  test('the min-width knob ships with the reference default', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <DialogModal>
          <Dialog aria-label="Confirm">Yes?</Dialog>
        </DialogModal>
      </DialogTrigger>
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(
      at('[data-scope="dialog"][data-part="surface"]').style.minWidth
    ).toBe('var(--fsl-dialog-min-width, min(288px, 90vw))');
  });
});
