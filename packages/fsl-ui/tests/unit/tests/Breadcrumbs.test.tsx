/**
 * Breadcrumbs — Navigation trail.
 *
 * Verifies the last crumb is the current location (text with aria-current,
 * not a link), earlier crumbs are links, and the current crumb reads the
 * navigation `current` color.
 */
import { render, screen } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Breadcrumb, Breadcrumbs } from 'src/index';

const renderTrail = () => {
  return render(
    <Breadcrumbs>
      <Breadcrumb href="/">Home</Breadcrumb>
      <Breadcrumb href="/reports">Reports</Breadcrumb>
      <Breadcrumb>Q3</Breadcrumb>
    </Breadcrumbs>
  );
};

describe('Breadcrumbs', () => {
  test('renders the trail root', () => {
    renderTrail();
    expect(
      document.querySelector('[data-scope="breadcrumbs"][data-part="root"]')
    ).not.toBeNull();
  });

  test('earlier crumbs are links', () => {
    renderTrail();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument();
  });

  test('the last crumb is the current location (aria-current, not a link)', () => {
    renderTrail();
    expect(screen.queryByRole('link', { name: 'Q3' })).toBeNull();
    const current = screen.getByText('Q3');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.style.color).toBe(
      vars.colors.navigation.primary.text?.current ??
        vars.colors.navigation.primary.text?.default
    );
  });
});
