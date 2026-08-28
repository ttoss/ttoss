/**
 * Drawer — Overlay-entity edge panel.
 *
 * The assertions worth having are the ones a centred modal would pass by
 * accident: that the panel is anchored to the edge it was asked for, that it
 * carries an accessible name (it renders a dialog), and that it takes its
 * measure from the scale `AppShell`'s sidebar uses — the property that lets a
 * sidebar become a drawer without changing width.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { Drawer, drawerMeta, type DrawerPlacement } from 'src/index';
import { PANEL_WIDTH } from 'src/tokens/panelWidth';

const surface = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="drawer"][data-part="surface"]'
  );
};

const backdrop = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="drawer"][data-part="backdrop"]'
  );
};

describe('Drawer', () => {
  test('is an Overlay surface', () => {
    expect(drawerMeta.entity).toBe('Overlay');
    expect(drawerMeta.structure).toBe('surface');
  });

  test('renders a named dialog — the name is required, never defaulted', () => {
    // ADR-001: flow-critical copy is caller-supplied. An unnamed dialog is
    // announced as an unlabelled region, so the type makes `aria-label`
    // mandatory and this pins that it reaches the dialog rather than the
    // backdrop.
    render(
      <Drawer aria-label="Navigation" isOpen>
        content
      </Drawer>
    );
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  });

  test.each([
    ['start', 'row', 'flex-start'],
    ['end', 'row', 'flex-end'],
    ['top', 'column', 'flex-start'],
    ['bottom', 'column', 'flex-end'],
  ] as ReadonlyArray<[DrawerPlacement, string, string]>)(
    'placement=%s anchors on the %s axis at %s',
    (placement, direction, justify) => {
      render(
        <Drawer aria-label="Panel" isOpen placement={placement}>
          content
        </Drawer>
      );
      const el = backdrop()!;
      expect(el.style.flexDirection).toBe(direction);
      expect(el.style.justifyContent).toBe(justify);
      expect(surface()).toHaveAttribute('data-placement', placement);
    }
  );

  test.each(['sm', 'md', 'lg'] as const)(
    'width=%s takes the shared panel measure, so a sidebar keeps its width',
    (width) => {
      render(
        <Drawer aria-label="Navigation" isOpen width={width}>
          content
        </Drawer>
      );
      expect(surface()?.style.inlineSize).toBe(PANEL_WIDTH[width]);
    }
  );

  test('a block-edge panel is full-bleed and content-sized, not panel-width', () => {
    render(
      <Drawer aria-label="Panel" isOpen placement="bottom" width="lg">
        content
      </Drawer>
    );
    // `width` names a measure on the inline axis; a top/bottom sheet spans it.
    expect(surface()?.style.inlineSize).toBe('100%');
  });

  test('keeps the anchored edge square and rounds only the free corners', () => {
    // A panel flush with the viewport would otherwise leave a sliver of scrim
    // in the corner and read as a floating card rather than a region.
    render(
      <Drawer aria-label="Navigation" isOpen placement="start">
        content
      </Drawer>
    );
    const el = surface()!;
    expect(el.style.borderStartStartRadius).toBe('0');
    expect(el.style.borderEndStartRadius).toBe('0');
    expect(el.style.borderStartEndRadius).toBe(vars.radii.surface);
  });

  test('is a size container, so the theme resolves cqi against the panel', () => {
    render(
      <Drawer aria-label="Navigation" isOpen>
        content
      </Drawer>
    );
    expect(surface()?.style.containerType).toBe('inline-size');
  });

  test('dismisses on Escape and reports it', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(
      <Drawer aria-label="Navigation" isOpen onOpenChange={onOpenChange}>
        content
      </Drawer>
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('renders nothing while closed', () => {
    render(
      <Drawer aria-label="Navigation" isOpen={false}>
        content
      </Drawer>
    );
    expect(surface()).toBeNull();
  });
});
