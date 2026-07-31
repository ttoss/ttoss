/**
 * Tabs — Navigation tab widget.
 *
 * Verifies ARIA roles, that selecting a tab shows its panel, keyboard arrow
 * navigation between tabs, and that the selected tab reads the navigation
 * `current` color.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { Tab, TabList, TabPanel, Tabs } from 'src/index';

const renderTabs = () => {
  return render(
    <Tabs>
      <TabList aria-label="Sections">
        <Tab id="a">Overview</Tab>
        <Tab id="b">Details</Tab>
      </TabList>
      <TabPanel id="a">Overview content</TabPanel>
      <TabPanel id="b">Details content</TabPanel>
    </Tabs>
  );
};

describe('Tabs', () => {
  test('exposes tablist / tab / tabpanel roles', () => {
    renderTabs();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview content');
  });

  test('the first tab is selected by default and reads the current color', () => {
    renderTabs();
    const first = screen.getByRole('tab', { name: 'Overview' });
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first.style.color).toBe(
      vars.colors.navigation.primary.text?.current ??
        vars.colors.navigation.primary.text?.default
    );
  });

  test('selecting a tab shows its panel', async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.click(screen.getByRole('tab', { name: 'Details' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Details content');
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('arrow keys move between tabs', async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.tab(); // focus the selected tab
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await user.keyboard('[ArrowRight]');
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();
  });

  test('a horizontal TabList lays tabs in a row with a block-end divider', () => {
    renderTabs();
    const list = screen.getByRole('tablist');
    expect(list.style.flexDirection).toBe('row');
    expect(list.style.gap).toBe(vars.spacing.gap.inline.sm);
    expect(list.style.borderBlockEndWidth).toBe(vars.border.divider.width);
    expect(list.style.borderInlineEndWidth).toBe('');
  });

  test('a vertical TabList lays tabs in a column with an inline-end divider', () => {
    render(
      <Tabs orientation="vertical">
        <TabList aria-label="Sections">
          <Tab id="a">Overview</Tab>
          <Tab id="b">Details</Tab>
        </TabList>
        <TabPanel id="a">Overview content</TabPanel>
        <TabPanel id="b">Details content</TabPanel>
      </Tabs>
    );
    const list = screen.getByRole('tablist');
    expect(list.style.flexDirection).toBe('column');
    expect(list.style.gap).toBe(vars.spacing.gap.stack.sm);
    expect(list.style.borderInlineEndWidth).toBe(vars.border.divider.width);
    expect(list.style.borderBlockEndWidth).toBe('');
  });

  test('the vertical selected-tab indicator sits on the inline-start edge', () => {
    render(
      <Tabs orientation="vertical">
        <TabList aria-label="Sections">
          <Tab id="a">Overview</Tab>
          <Tab id="b">Details</Tab>
        </TabList>
        <TabPanel id="a">Overview content</TabPanel>
        <TabPanel id="b">Details content</TabPanel>
      </Tabs>
    );
    const indicator = document.querySelector(
      '[data-scope="tabs"][data-part="indicator"]'
    ) as HTMLElement;
    expect(indicator.style.borderInlineStartWidth).toBe(
      vars.border.outline.selected.width
    );
    expect(indicator.style.borderBlockEndWidth).toBe('');
  });

  test('the horizontal selected-tab indicator stays a block-end underline', () => {
    renderTabs();
    const indicator = document.querySelector(
      '[data-scope="tabs"][data-part="indicator"]'
    ) as HTMLElement;
    expect(indicator.style.borderBlockEndWidth).toBe(
      vars.border.outline.selected.width
    );
    expect(indicator.style.borderInlineStartWidth).toBe('');
  });
});
