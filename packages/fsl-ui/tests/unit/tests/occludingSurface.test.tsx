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
  Tooltip,
  TooltipTrigger,
} from 'src/index';
import { OCCLUDING_OUTLINE } from 'src/tokens/occludingSurface';

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
