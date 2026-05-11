/**
 * DialogActions — runtime composition-driven ordering.
 *
 * These tests are the evidence that the FSL `Composition` dimension is
 * behavior-driving, not decorative: `DialogActions` reads
 * `child.props.composition` at runtime and reorders the DOM per platform
 * convention (iOS vs Windows HIG).
 *
 * If this test suite is deleted and nothing else dispatches on
 * `composition`, the dimension collapses to documented convention and
 * belongs out of `ComponentMeta`. See ISSUE.md §2.2.
 */
import { render, screen } from '@testing-library/react';
import type * as React from 'react';
import { Button, Dialog, DialogActions } from 'src/index';

// Sub-parts of Dialog (DialogActions, DialogHeading, DialogBody) require a
// Dialog scope at runtime — see `composites/scope.ts` and the
// `compositeScope.test.tsx` suite. Tests that exercise sub-part behavior in
// isolation must therefore mount them inside a Dialog host.
const renderInDialog = (children: React.ReactNode) => {
  // `aria-label` silences React Aria's a11y warning ("a Dialog must have a
  // title or label") in this isolated unit test of `DialogActions`.
  return render(<Dialog aria-label="test dialog">{children}</Dialog>);
};

const renderActions = (platform?: 'ios' | 'windows') => {
  // Source order is intentionally scrambled: primary FIRST, dismiss LAST.
  // A naive flex container would render them in source order; the runtime
  // reorder is what the test is proving.
  return renderInDialog(
    <DialogActions platform={platform}>
      <Button composition="primaryAction">Save</Button>
      <Button composition="secondaryAction">Draft</Button>
      <Button composition="dismissAction" slot="close">
        Cancel
      </Button>
    </DialogActions>
  );
};

const buttonLabelsInOrder = (container: HTMLElement): string[] => {
  const actions = container.querySelector<HTMLElement>('[data-part="actions"]');
  if (!actions) throw new Error('DialogActions root not found');
  return Array.from(actions.querySelectorAll('button')).map((b) => {
    return b.textContent ?? '';
  });
};

describe('DialogActions — composition-driven ordering', () => {
  test('defaults to iOS convention: dismiss → secondary → primary', () => {
    const { container } = renderActions();
    expect(buttonLabelsInOrder(container)).toEqual(['Cancel', 'Draft', 'Save']);
  });

  test('platform="ios" matches the default', () => {
    const { container } = renderActions('ios');
    expect(buttonLabelsInOrder(container)).toEqual(['Cancel', 'Draft', 'Save']);
  });

  test('platform="windows" reverses to: primary → secondary → dismiss', () => {
    const { container } = renderActions('windows');
    expect(buttonLabelsInOrder(container)).toEqual(['Save', 'Draft', 'Cancel']);
  });

  test('emits data-platform on the actions root', () => {
    renderInDialog(
      <DialogActions platform="windows">
        <Button composition="primaryAction">Save</Button>
      </DialogActions>
    );
    const actions = screen.getByText('Save').closest('[data-part="actions"]');
    expect(actions).toHaveAttribute('data-platform', 'windows');
  });

  test('Button emits data-composition', () => {
    render(<Button composition="primaryAction">Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'data-composition',
      'primaryAction'
    );
  });

  test('children without a composition prop keep source order after ranked ones', () => {
    const { container } = renderInDialog(
      <DialogActions platform="ios">
        <Button>Unranked A</Button>
        <Button composition="primaryAction">Save</Button>
        <Button>Unranked B</Button>
        <Button composition="dismissAction" slot="close">
          Cancel
        </Button>
      </DialogActions>
    );
    // iOS ranking: Cancel (0), Save (2). Unranked preserve their relative
    // source order ('A' before 'B') and come last.
    expect(buttonLabelsInOrder(container)).toEqual([
      'Cancel',
      'Save',
      'Unranked A',
      'Unranked B',
    ]);
  });

  test('source order is preserved when no child declares composition', () => {
    const { container } = renderInDialog(
      <DialogActions platform="windows">
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </DialogActions>
    );
    expect(buttonLabelsInOrder(container)).toEqual(['One', 'Two', 'Three']);
  });
});
