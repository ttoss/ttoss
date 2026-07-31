/**
 * ButtonGroup — the action row.
 *
 * Two things carry the component: the rhythm it fixes (one gap for every
 * action row in a product, not a caller choice) and the overflow behaviour
 * (a row that does not fit becomes a column). The second is layout-dependent,
 * and jsdom has no layout — every box reports zero — so the measurement is
 * driven by stubbing the same three properties the component reads
 * (`offsetWidth`, `offsetLeft` on the children). That is the honest limit of
 * this suite: it proves the *decision* the measurement produces, while the
 * measurement itself is verified in a real browser.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';

import { ActionButton, Button, ButtonGroup, ToggleButton } from '../../../src';

const getRoot = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    '[data-scope="button-group"][data-part="root"]'
  );
  if (!el) throw new Error('button group not rendered');
  return el;
};

/**
 * Stubs the layout the component measures: the group's own width and each
 * child's inline position/extent. `configurable` so the next test can redefine
 * them on a fresh element.
 */
const stubLayout = ({
  groupWidth,
  children,
}: {
  groupWidth: number;
  children: Array<{ offsetLeft: number; offsetWidth: number }>;
}) => {
  const root = getRoot();

  Object.defineProperty(root, 'offsetWidth', {
    configurable: true,
    value: groupWidth,
  });

  for (const [index, node] of Array.from(root.children).entries()) {
    const layout = children[index];
    if (!layout) continue;
    Object.defineProperty(node, 'offsetLeft', {
      configurable: true,
      value: layout.offsetLeft,
    });
    Object.defineProperty(node, 'offsetWidth', {
      configurable: true,
      value: layout.offsetWidth,
    });
  }
};

const ROW = {
  groupWidth: 400,
  children: [
    { offsetLeft: 0, offsetWidth: 100 },
    { offsetLeft: 112, offsetWidth: 120 },
  ],
};

const OVERFLOWING = {
  groupWidth: 180,
  children: [
    { offsetLeft: 0, offsetWidth: 100 },
    { offsetLeft: 112, offsetWidth: 120 },
  ],
};

describe('ButtonGroup — identity', () => {
  test('exposes its identity attributes and the resolved axis', () => {
    render(
      <ButtonGroup>
        <Button>Save</Button>
      </ButtonGroup>
    );
    const root = getRoot();

    expect(root).toHaveAttribute('data-scope', 'button-group');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
  });

  test('emits no role — an unnamed group is screen-reader noise', () => {
    render(
      <ButtonGroup>
        <Button>Save</Button>
      </ButtonGroup>
    );

    expect(getRoot()).not.toHaveAttribute('role');
  });

  test('passes DOM attributes through, so a named region stays possible', () => {
    render(
      <ButtonGroup role="group" aria-label="Record actions">
        <Button>Save</Button>
      </ButtonGroup>
    );

    expect(screen.getByRole('group', { name: 'Record actions' })).toBe(
      getRoot()
    );
  });
});

describe('ButtonGroup — the fixed rhythm', () => {
  test('reads one gap token, whatever the axis', () => {
    const { unmount } = render(
      <ButtonGroup>
        <Button>Save</Button>
      </ButtonGroup>
    );

    // A columnised row is the same set of actions, not a new stacking rhythm —
    // so it does NOT switch to the `gap.stack` family the way `Stack` does.
    expect(getRoot().style.gap).toBe(vars.spacing.gap.inline.sm);
    unmount();

    render(
      <ButtonGroup orientation="vertical">
        <Button>Save</Button>
      </ButtonGroup>
    );
    expect(getRoot().style.gap).toBe(vars.spacing.gap.inline.sm);
  });

  test('establishes the offset parent the measurement depends on', () => {
    render(
      <ButtonGroup>
        <Button>Save</Button>
      </ButtonGroup>
    );

    expect(getRoot().style.position).toBe('relative');
  });
});

describe('ButtonGroup — alignment', () => {
  test('a row aligns on the main axis; the cross axis stays centred', () => {
    render(
      <ButtonGroup align="end">
        <Button>Save</Button>
      </ButtonGroup>
    );
    const { style } = getRoot();

    expect(style.flexDirection).toBe('row');
    expect(style.justifyContent).toBe('flex-end');
    expect(style.alignItems).toBe('center');
  });

  test('a column aligns on the cross axis instead', () => {
    render(
      <ButtonGroup orientation="vertical" align="end">
        <Button>Save</Button>
      </ButtonGroup>
    );
    const { style } = getRoot();

    expect(style.flexDirection).toBe('column');
    expect(style.alignItems).toBe('flex-end');
    expect(style.justifyContent).toBe('flex-start');
  });

  test('defaults to start on both axes', () => {
    render(
      <ButtonGroup>
        <Button>Save</Button>
      </ButtonGroup>
    );

    expect(getRoot().style.justifyContent).toBe('flex-start');
  });
});

describe('ButtonGroup — grouped triggers hold their width', () => {
  test.each([
    ['Button', <Button key="b">Save</Button>, 'button'],
    [
      'ActionButton',
      <ActionButton key="a">Edit</ActionButton>,
      'action-button',
    ],
    [
      'ToggleButton',
      <ToggleButton key="t">Bold</ToggleButton>,
      'toggle-button',
    ],
  ])('%s stops shrinking inside the group', (_name, element, scope) => {
    const { unmount } = render(<ButtonGroup>{element}</ButtonGroup>);

    const trigger = document.querySelector<HTMLElement>(
      `[data-scope="${scope}"][data-part="root"]`
    );
    // Without this the trigger squashes below its own label: its explicit
    // `min-width` (the hit floor) overrides a flex item's automatic minimum
    // size, so the label would clip instead of the row overflowing.
    expect(trigger?.style.flexShrink).toBe('0');
    unmount();

    // Outside a group it stays an ordinary flex item.
    render(<div>{element}</div>);
    const lone = document.querySelector<HTMLElement>(
      `[data-scope="${scope}"][data-part="root"]`
    );
    expect(lone?.style.flexShrink).toBe('');
  });

  test('the context reaches a trigger through a wrapper', () => {
    render(
      <ButtonGroup>
        <span>
          <Button>Save</Button>
        </span>
      </ButtonGroup>
    );

    const trigger = document.querySelector<HTMLElement>(
      '[data-scope="button"][data-part="root"]'
    );
    expect(trigger?.style.flexShrink).toBe('0');
  });
});

describe('ButtonGroup — collapsing an overflowing row', () => {
  test('stays a row while the children fit', async () => {
    const { rerender } = render(
      <ButtonGroup>
        <Button>Cancel</Button>
        <Button>Save changes</Button>
      </ButtonGroup>
    );

    stubLayout(ROW);
    rerender(
      <ButtonGroup>
        <Button>Cancel</Button>
        <Button>Save changes </Button>
      </ButtonGroup>
    );

    await waitFor(() => {
      expect(getRoot()).toHaveAttribute('data-orientation', 'horizontal');
    });
    expect(getRoot()).not.toHaveAttribute('data-collapsed');
  });

  test('collapses to a column when a child sticks out, and says so', async () => {
    const { rerender } = render(
      <ButtonGroup>
        <Button>Cancel</Button>
        <Button>Save changes</Button>
      </ButtonGroup>
    );

    stubLayout(OVERFLOWING);
    // A new children identity is what invalidates the last measurement — the
    // same signal a parent re-render sends in a real app.
    rerender(
      <ButtonGroup>
        <Button>Cancel</Button>
        <Button>Save changes </Button>
      </ButtonGroup>
    );

    await waitFor(() => {
      expect(getRoot()).toHaveAttribute('data-orientation', 'vertical');
    });
    // `data-collapsed` separates "the author asked for a column" from "the row
    // had to give way", which host CSS and tests both need to tell apart.
    expect(getRoot()).toHaveAttribute('data-collapsed', 'true');
    expect(getRoot().style.flexDirection).toBe('column');
  });

  test('a negative offset counts as overflow (align="end" pushes off the start edge)', async () => {
    const { rerender } = render(
      <ButtonGroup align="end">
        <Button>Cancel</Button>
        <Button>Save changes</Button>
      </ButtonGroup>
    );

    stubLayout({
      groupWidth: 180,
      children: [
        { offsetLeft: -40, offsetWidth: 100 },
        { offsetLeft: 72, offsetWidth: 100 },
      ],
    });
    rerender(
      <ButtonGroup align="end">
        <Button>Cancel</Button>
        <Button>Save changes </Button>
      </ButtonGroup>
    );

    await waitFor(() => {
      expect(getRoot()).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  test('an authored column never measures and never reports collapsing', async () => {
    const { rerender } = render(
      <ButtonGroup orientation="vertical">
        <Button>Cancel</Button>
        <Button>Save changes</Button>
      </ButtonGroup>
    );

    stubLayout(OVERFLOWING);
    rerender(
      <ButtonGroup orientation="vertical">
        <Button>Cancel</Button>
        <Button>Save changes </Button>
      </ButtonGroup>
    );

    await waitFor(() => {
      expect(getRoot()).toHaveAttribute('data-orientation', 'vertical');
    });
    // Pinned by the author, not by measurement — so no collapse marker.
    expect(getRoot()).not.toHaveAttribute('data-collapsed');
  });

  test('re-measures when the container resizes, without any prop changing', async () => {
    // jsdom has no layout, so the ResizeObserver polyfill never fires on its
    // own. Drive it directly instead: capture the callback the component
    // registers, then invoke it. What is under test is our wiring — that a
    // container resize alone triggers a fresh pass.
    const observers: Array<{
      callback: ResizeObserverCallback;
      targets: Element[];
    }> = [];
    const RealResizeObserver = global.ResizeObserver;

    global.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        this.entry = { callback, targets: [] };
        observers.push(this.entry);
      }
      private entry: { callback: ResizeObserverCallback; targets: Element[] };
      observe(target: Element) {
        this.entry.targets.push(target);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    try {
      render(
        <ButtonGroup>
          <Button>Cancel</Button>
          <Button>Save changes</Button>
        </ButtonGroup>
      );

      expect(getRoot()).toHaveAttribute('data-orientation', 'horizontal');
      // The group's own size does not change when its container does — the
      // container is what has to be watched.
      expect(observers).toHaveLength(1);
      expect(observers[0]?.targets).toEqual([getRoot().parentElement]);

      stubLayout(OVERFLOWING);
      observers[0]?.callback([], {} as ResizeObserver);

      await waitFor(() => {
        expect(getRoot()).toHaveAttribute('data-orientation', 'vertical');
      });
    } finally {
      global.ResizeObserver = RealResizeObserver;
    }
  });

  test('survives an environment without ResizeObserver', () => {
    const RealResizeObserver = global.ResizeObserver;
    // @ts-expect-error — deliberately removing the global for this assertion.
    delete global.ResizeObserver;

    try {
      expect(() => {
        render(
          <ButtonGroup>
            <Button>Save</Button>
          </ButtonGroup>
        );
      }).not.toThrow();
      // The one-shot mount measurement still ran; only the resize watch is lost.
      expect(getRoot()).toHaveAttribute('data-orientation', 'horizontal');
    } finally {
      global.ResizeObserver = RealResizeObserver;
    }
  });
});
