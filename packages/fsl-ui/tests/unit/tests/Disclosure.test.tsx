/**
 * Disclosure — standalone Disclosure-entity collapsible section.
 *
 * Verifies identity, the expand/collapse toggle (pointer + keyboard), and
 * that the panel content appears only when expanded.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Disclosure, DisclosurePanel, DisclosureTrigger } from 'src/index';

const renderDisclosure = () => {
  return render(
    <Disclosure>
      <DisclosureTrigger>Advanced options</DisclosureTrigger>
      <DisclosurePanel>Rarely-needed settings.</DisclosurePanel>
    </Disclosure>
  );
};

describe('Disclosure', () => {
  test('renders the root identity and a collapsed trigger', () => {
    renderDisclosure();
    expect(
      document.querySelector('[data-scope="disclosure"][data-part="root"]')
    ).not.toBeNull();
    const trigger = screen.getByRole('button', { name: 'Advanced options' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking the trigger expands and collapses the section', async () => {
    const user = userEvent.setup();
    renderDisclosure();
    const trigger = screen.getByRole('button', { name: 'Advanced options' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Rarely-needed settings.')).toBeVisible();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('the trigger toggles via keyboard (Enter)', async () => {
    const user = userEvent.setup();
    renderDisclosure();
    const trigger = screen.getByRole('button', { name: 'Advanced options' });
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('renders a configurable heading level', () => {
    render(
      <Disclosure>
        <DisclosureTrigger headingLevel={2}>Section</DisclosureTrigger>
        <DisclosurePanel>Body</DisclosurePanel>
      </Disclosure>
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Section' })
    ).toBeInTheDocument();
  });

  test('panel inset lives on an inner wrapper, not the panel element', () => {
    // Regression: React Aria collapses the panel with `hidden="until-found"`
    // (content-visibility: hidden), which keeps the element's own box. Padding
    // on the panel element itself would leak as empty height when collapsed, so
    // it must sit on an inner wrapper that is skipped along with the content.
    render(
      <Disclosure>
        <DisclosureTrigger>Advanced options</DisclosureTrigger>
        <DisclosurePanel>Body</DisclosurePanel>
      </Disclosure>
    );
    const panel = document.querySelector<HTMLElement>(
      '[data-scope="disclosure"][data-part="content"]'
    );
    expect(panel?.style.paddingBlock).toBe('');
    expect(panel?.style.paddingInline).toBe('');
    const inner = panel?.firstElementChild as HTMLElement | null;
    expect(inner?.style.paddingBlock).not.toBe('');
    expect(inner).toHaveTextContent('Body');
  });
});
