/**
 * The Overlay family's behavioural contract — P3 review round 2.
 *
 * Round 1 covered Overlay's geometry and colour (F-044…F-047) and left the
 * behaviour half explicitly owed: focus containment, dismiss semantics, and
 * the APG contract each role promises. Measuring it found no defect — every
 * member already holds its promise, because React Aria supplies it. That is
 * precisely why this file exists: **the promise was published and unguarded**.
 * Each component's JSDoc tells a consumer the surface dismisses, contains
 * focus, or never takes it; nothing failed if a refactor took that away.
 *
 * Scope filter (fsl-tests §2). This suite owns the *wiring*, not React Aria's
 * correctness: which primitive each composite composes, and which behavioural
 * props it passes. If `DialogModal` stopped composing `ModalOverlay`, or a
 * `Popover` were handed `isNonModal`, the delegate would still be correct and
 * our published contract would still be broken — nothing else catches that.
 *
 * Uniqueness (fsl-tests §3). `keyboard.test.tsx` already pins Menu's and
 * Dialog's Escape/restore and Dialog's Tab trap; none of that is restated
 * here. What is pinned here is the modality substitute, the three members
 * that suite never reached (Drawer, Popover, ConfirmationDialog), and the
 * three discriminants below.
 *
 * Discriminants are asserted from both sides, as in `occludingSurface`: a
 * non-blocking overlay must **not** blank the page, a modal must **not**
 * light-dismiss, and a Tooltip must **never** hold focus. Without them,
 * "make every overlay modal and dismissable" would pass.
 *
 * Note on modality (an unstated invariant this suite now states): no surface
 * here carries `aria-modal`. React Aria hides the rest of the tree with
 * `aria-hidden` instead — `ariaHideOutside` — which is why the assertions ask
 * whether outside content is reachable rather than whether an attribute is
 * present. Asserting `aria-modal` would fail on a correct implementation.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import {
  Button,
  ConfirmationDialog,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeading,
  DialogModal,
  DialogTrigger,
  Drawer,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverTrigger,
  TextField,
  Tooltip,
  TooltipTrigger,
} from 'src/index';

// user-event + React Aria need real timers to settle transitions/presses.
beforeEach(() => {
  jest.useRealTimers();
});

/** Walks ancestors, because `ariaHideOutside` hides a container, not the leaf. */
const isReachableByAssistiveTech = (el: Element): boolean => {
  let node: Element | null = el;
  while (node) {
    if (node.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    node = node.parentElement;
  }
  return true;
};

const surfaceCount = (scope: string): number => {
  return document.querySelectorAll(`[data-scope="${scope}"]`).length;
};

const page = () => {
  return screen.getByTestId('page-copy');
};

const openButton = () => {
  return screen.getByRole('button', { name: 'Open' });
};

// ---------------------------------------------------------------------------
// 1. The modality substitute
// ---------------------------------------------------------------------------

describe('an occluding overlay takes the page out of the accessibility tree', () => {
  test('Menu', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p data-testid="page-copy">page copy</p>
        <MenuTrigger>
          <Button>Open</Button>
          <Menu>
            <MenuItem>Rename</MenuItem>
          </Menu>
        </MenuTrigger>
      </>
    );

    expect(isReachableByAssistiveTech(page())).toBe(true);
    await user.click(openButton());
    expect(isReachableByAssistiveTech(page())).toBe(false);
  });

  test('DialogModal', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p data-testid="page-copy">page copy</p>
        <DialogTrigger>
          <Button>Open</Button>
          <DialogModal>
            <Dialog>
              <DialogHeading>Delete workspace</DialogHeading>
              <DialogBody>This cannot be undone.</DialogBody>
              <DialogActions>
                <Button slot="close">Cancel</Button>
              </DialogActions>
            </Dialog>
          </DialogModal>
        </DialogTrigger>
      </>
    );

    await user.click(openButton());
    expect(isReachableByAssistiveTech(page())).toBe(false);
  });

  test('Drawer', () => {
    render(
      <>
        <p data-testid="page-copy">page copy</p>
        <Drawer isOpen aria-label="Navigation">
          <Button>Inside</Button>
        </Drawer>
      </>
    );

    expect(isReachableByAssistiveTech(page())).toBe(false);
  });

  test('Popover', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p data-testid="page-copy">page copy</p>
        <PopoverTrigger>
          <Button>Open</Button>
          <Popover>
            <TextField label="Name" />
          </Popover>
        </PopoverTrigger>
      </>
    );

    await user.click(openButton());
    expect(isReachableByAssistiveTech(page())).toBe(false);
  });

  // The discriminant. A Tooltip occludes pixels but blocks nothing: it is
  // shown by hover/focus on content the user is still reading, and hiding
  // that content would make the hint unreadable by the reader it is for.
  test('a Tooltip does not — it is non-blocking', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p data-testid="page-copy">page copy</p>
        <TooltipTrigger delay={0}>
          <Button>Save</Button>
          <Tooltip>Saves the current draft</Tooltip>
        </TooltipTrigger>
      </>
    );

    await user.tab();
    expect(surfaceCount('tooltip')).toBe(1);
    expect(isReachableByAssistiveTech(page())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Dismiss semantics — the three members `keyboard.test.tsx` never reached
// ---------------------------------------------------------------------------

describe('Drawer dismisses and hands focus back', () => {
  const Harness = () => {
    const [isOpen, setOpen] = React.useState(false);

    return (
      <>
        <Button
          onPress={() => {
            return setOpen(true);
          }}
        >
          Open
        </Button>
        <Drawer isOpen={isOpen} onOpenChange={setOpen} aria-label="Navigation">
          <Button>Inside</Button>
        </Drawer>
      </>
    );
  };

  test('Escape closes it and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());
    expect(surfaceCount('drawer')).toBeGreaterThan(0);

    await user.keyboard('{Escape}');
    expect(surfaceCount('drawer')).toBe(0);
    await waitFor(() => {
      expect(openButton()).toHaveFocus();
    });
  });
});

describe('Popover dismisses both ways and contains focus while open', () => {
  const renderPopover = () => {
    return render(
      <>
        <PopoverTrigger>
          <Button>Open</Button>
          <Popover>
            <TextField label="Name" />
            <Button>Apply</Button>
          </Popover>
        </PopoverTrigger>
        <Button>After</Button>
      </>
    );
  };

  test('Escape closes it and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(openButton());
    await user.keyboard('{Escape}');

    expect(surfaceCount('popover')).toBe(0);
    await waitFor(() => {
      expect(openButton()).toHaveFocus();
    });
  });

  test('an outside press light-dismisses it', async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(openButton());
    await user.click(document.body);

    expect(surfaceCount('popover')).toBe(0);
  });

  // Tab cycles inside rather than escaping into the page behind: the surface
  // holds interactive content, so leaving it by Tab would strand the user in
  // a page their reader can no longer see (assertion 1 above).
  test('Tab cycles within the surface instead of reaching the page', async () => {
    const user = userEvent.setup();
    renderPopover();

    // Captured before opening: once the page is hidden, a role query cannot
    // reach it — which is assertion 1 doing its job.
    const outside = screen.getByRole('button', { name: 'After' });

    await user.click(openButton());
    await user.keyboard('{Tab}');
    const first = document.activeElement;
    await user.keyboard('{Tab}');
    const second = document.activeElement;
    await user.keyboard('{Tab}');

    expect(first).toBe(screen.getByRole('textbox', { name: 'Name' }));
    expect(second).toBe(screen.getByRole('button', { name: 'Apply' }));
    expect(document.activeElement).toBe(first);
    expect(outside).not.toHaveFocus();
  });
});

describe('ConfirmationDialog dismisses without committing', () => {
  // The consequence-critical one: a destructive confirmation must be
  // abandonable, and abandoning it must not call the effect.
  test('Escape closes it and never invokes onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(
      <ConfirmationDialog
        title="Delete workspace"
        confirmLabel="Delete"
        armedLabel="Confirm delete"
        cancelLabel="Cancel"
        consequence="destructive"
        onConfirm={onConfirm}
        trigger={<Button>Open</Button>}
      >
        This cannot be undone.
      </ConfirmationDialog>
    );

    await user.click(openButton());
    await user.keyboard('{Escape}');

    expect(surfaceCount('confirmation-dialog')).toBe(0);
    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(openButton()).toHaveFocus();
    });
  });
});

// The discriminant for §2. A modal prompt is the one overlay a stray click
// must not destroy — the user is mid-decision, and the decision is the point.
describe('a modal prompt does not light-dismiss', () => {
  test('an outside press leaves DialogModal open', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <DialogModal>
          <Dialog>
            <DialogHeading>Delete workspace</DialogHeading>
            <DialogActions>
              <Button slot="close">Cancel</Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );

    await user.click(openButton());
    await user.click(document.body);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. The APG contracts each role publishes
// ---------------------------------------------------------------------------

describe('the Menu trigger publishes the menu-button contract', () => {
  test('aria-controls resolves to the menu itself, not the surface around it', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>Open</Button>
        <Menu>
          <MenuItem>Rename</MenuItem>
        </Menu>
      </MenuTrigger>
    );

    const trigger = openButton();
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // React Aria wraps an anchored surface in `role="dialog"` unless it is
    // told `isNonModal` (upstream default, and the reference's behaviour) —
    // so "the trigger points at a menu" is a real, breakable claim: it holds
    // only because the pointer targets the inner list, not that wrapper.
    const controlled = document.getElementById(
      trigger.getAttribute('aria-controls') ?? ''
    );
    expect(controlled).toBe(screen.getByRole('menu'));
  });
});

describe('a dialog surface carries a name a reader can announce', () => {
  test('aria-labelledby resolves to the rendered heading', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <DialogModal>
          <Dialog>
            <DialogHeading>Delete workspace</DialogHeading>
            <DialogActions>
              <Button slot="close">Cancel</Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );

    await user.click(openButton());

    // Pinning the resolved text, not the attribute: a dangling id is the
    // failure this catches, and an attribute assertion cannot see it.
    expect(
      screen.getByRole('dialog', { name: 'Delete workspace' })
    ).toBeInTheDocument();
  });

  test('a Drawer names itself from the aria-label its type demands', () => {
    render(
      <Drawer isOpen aria-label="Navigation">
        <Button>Inside</Button>
      </Drawer>
    );

    expect(
      screen.getByRole('dialog', { name: 'Navigation' })
    ).toBeInTheDocument();
  });
});

describe('a Tooltip describes its trigger and never becomes one', () => {
  const renderTooltip = () => {
    return render(
      <TooltipTrigger delay={0} closeDelay={0}>
        <Button>Save</Button>
        <Tooltip>Saves the current draft</Tooltip>
      </TooltipTrigger>
    );
  };

  const tip = () => {
    return document.querySelector<HTMLElement>(
      '[data-scope="tooltip"][data-part="root"]'
    );
  };

  test('it is wired as the trigger description, not as its name', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Save' });

    expect(tip()).toHaveAttribute('role', 'tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tip()?.id);
    // The name stays the trigger's own copy — a tooltip that renamed its
    // trigger would silently replace the label a reader announces.
    expect(trigger).toHaveAccessibleName('Save');
  });

  // The discriminant for §3. The component's JSDoc forbids interactive
  // content precisely because the surface is unreachable: it is not in the
  // tab order and vanishes on blur.
  test('the surface is never a tab stop', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(tip()).not.toHaveAttribute('tabindex');

    await user.tab();
    expect(tip()).toBeNull();
  });

  test('Escape dismisses it while the trigger keeps focus', async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(surfaceCount('tooltip')).toBe(1);

    await user.keyboard('{Escape}');

    expect(surfaceCount('tooltip')).toBe(0);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });
});
