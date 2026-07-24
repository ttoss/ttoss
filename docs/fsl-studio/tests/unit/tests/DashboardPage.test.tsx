import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEPLOYS, KPIS } from 'src/data';
import {
  DashboardPage,
  formatAge,
  formatDuration,
} from 'src/pages/DashboardPage';

describe('formatDuration', () => {
  test.each([
    [null, '—'],
    [74, '74s'],
  ])('%s → %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatAge', () => {
  test.each([
    [2, '2m ago'],
    [59, '59m ago'],
    [61, '1h ago'],
    [610, '10h ago'],
  ])('%s → %s', (minutes, expected) => {
    expect(formatAge(minutes)).toBe(expected);
  });
});

describe('DashboardPage', () => {
  test('renders every KPI tile', () => {
    render(<DashboardPage />);

    for (const kpi of KPIS) {
      // "Deploys this week" also titles the chart card — allow duplicates.
      expect(screen.getAllByText(kpi.label).length).toBeGreaterThan(0);
      expect(screen.getByText(kpi.value)).toBeInTheDocument();
    }
  });

  test('the activity chart is an accessible image summarizing the series', () => {
    render(<DashboardPage />);

    const chart = screen.getByRole('img', { name: /Deploys per day/ });
    expect(chart).toHaveAccessibleName(expect.stringContaining('Total 90'));
  });

  test('renders one deploy row per deploy, newest first', () => {
    render(<DashboardPage />);

    const table = screen.getByRole('grid', { name: 'Recent deploys' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(DEPLOYS.length);
    expect(rows[0]).toHaveTextContent('marketing-site');
    expect(rows[0]).toHaveTextContent('Building');
  });

  test('sorting by project reorders the rows', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByText('Project'));

    const table = screen.getByRole('grid', { name: 'Recent deploys' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('api-gateway');
  });

  test('sorting by status, descending on second click', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByText('Status'));
    const table = screen.getByRole('grid', { name: 'Recent deploys' });
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Building');

    await user.click(screen.getByText('Status'));
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Ready');
  });
});
