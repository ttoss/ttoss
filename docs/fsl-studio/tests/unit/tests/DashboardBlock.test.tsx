import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { axe } from 'jest-axe';

import { DashboardBlock } from '../../../src/blocks/DashboardBlock';
import { studioVars, theme } from '../../../src/theme';

const renderBlock = () => {
  return render(
    <ThemeProvider theme={theme}>
      <DashboardBlock />
    </ThemeProvider>
  );
};

test('the studio theme carries the dataviz extension', () => {
  expect(theme.base.semantic.dataviz).toBeDefined();
  expect(studioVars.dataviz.color.series[1]).toBe(
    'var(--tt-dataviz-color-series-1)'
  );
  expect(studioVars.dataviz.encoding.stroke.reference).toBe(
    'var(--tt-dataviz-encoding-stroke-reference)'
  );
});

test('renders KPI tiles with values and evaluative deltas', async () => {
  const { container } = renderBlock();

  expect(
    screen.getByRole('heading', { name: 'Workspace analytics' })
  ).toBeInTheDocument();
  expect(screen.getByText('Active members')).toBeInTheDocument();
  expect(screen.getByText('128')).toBeInTheDocument();
  expect(screen.getByText('+12%')).toBeInTheDocument();
  expect(screen.getByText('−9%')).toBeInTheDocument();

  // aria-allowed-attr: documented axe false positive on RAC Meter's
  // deliberate `role="meter progressbar"` fallback — same exception as the
  // fsl-ui Meter fixture (see fsl-ui domFixtures.tsx).
  expect(
    await axe(container, {
      rules: { 'aria-allowed-attr': { enabled: false } },
    })
  ).toHaveNoViolations();
});

test('the chart draws token-driven series bars and the target line', () => {
  const { container } = renderBlock();

  expect(
    screen.getByRole('img', { name: /Deploys per week/ })
  ).toBeInTheDocument();

  const production = container.querySelectorAll('[data-series="production"]');
  const preview = container.querySelectorAll('[data-series="preview"]');
  expect(production).toHaveLength(8);
  expect(preview).toHaveLength(8);
  expect((production[0] as SVGElement).style.fill).toBe(
    studioVars.dataviz.color.series[1]
  );
  expect((preview[0] as SVGElement).style.fill).toBe(
    studioVars.dataviz.color.series[2]
  );

  const target = container.querySelector('[data-reference="target"]');
  expect(target).not.toBeNull();
  expect((target as SVGElement).style.strokeDasharray).toBe(
    studioVars.dataviz.encoding.stroke.reference
  );
  expect((target as SVGElement).style.stroke).toBe(
    studioVars.dataviz.color.reference.target
  );

  // Legend names both series and the target.
  expect(screen.getByText('Production')).toBeInTheDocument();
  expect(screen.getByText('Preview')).toBeInTheDocument();
  expect(screen.getByText('Target (48/week)')).toBeInTheDocument();
});

test('capacity meters expose accessible values', () => {
  const { container } = renderBlock();

  const meters = container.querySelectorAll(
    '[data-scope="meter"][data-part="root"]'
  );
  expect(meters).toHaveLength(2);

  const [storage, seats] = [...meters];
  expect(storage).toHaveAttribute('aria-valuenow', '62');
  expect(seats).toHaveAttribute('aria-valuenow', '128');
  expect(seats).toHaveAttribute('aria-valuemax', '150');
  expect(seats).toHaveAttribute('data-evaluation', 'caution');
  expect(screen.getByText('Storage used')).toBeInTheDocument();
  expect(screen.getByText('Seats used')).toBeInTheDocument();
  expect(screen.getByText('128 of 150')).toBeInTheDocument();
});
