/**
 * The warnings panel: resolved warnings, blocking failures, repair actions and
 * the cold-start empty state.
 */

import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import { GeovisWorkspace } from 'src';

import {
  config,
  failingVisualizationSpec,
  openRightSidebar,
  Provider,
  visualizationSpec,
  visualizationSpecWithWarnings,
} from './geovisWorkspaceTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./geovisWorkspaceTestUtils').createGeoVisMock();
});

test('warnings panel shows a resolved result warning with its i18n text and subject', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpecWithWarnings}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(
    screen.getByText('This map violates the cartography policy.')
  ).toBeInTheDocument();
  expect(
    screen.getByText('metadata.metricField (policy-invalid)')
  ).toBeInTheDocument();
});

test('warnings panel shows a blocking failure that follows a successful resolve', async () => {
  const { rerender } = render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  rerender(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />
  );

  await openRightSidebar();

  expect(
    screen.getByText('A layer references a map data id that does not exist.')
  ).toBeInTheDocument();
  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
});

test('warnings panel falls back to the raw message for a code with no catalog entry', async () => {
  const specWithUnknownCode = {
    ...visualizationSpec,
    mockResult: {
      status: 'resolved' as const,
      spec: visualizationSpec,
      warnings: [
        {
          code: 'made-up-code' as never,
          subject: { path: '$' },
          message: 'Raw untranslated message.',
        },
      ],
    },
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={specWithUnknownCode} />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('Raw untranslated message.')).toBeInTheDocument();
});

test('an allowed-values repair renders one button per value and calls onRepair with the chosen value', async () => {
  const onRepair = jest.fn();

  const { rerender } = render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      onRepair={onRepair}
    />,
    { wrapper: Provider }
  );

  rerender(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
      onRepair={onRepair}
    />
  );

  await openRightSidebar();

  const choroplethButton = screen.getByRole('button', { name: 'choropleth' });
  const dotsButton = screen.getByRole('button', { name: 'dots' });
  expect(choroplethButton).toBeInTheDocument();
  expect(dotsButton).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(choroplethButton);
  });

  expect(onRepair).toHaveBeenCalledWith({
    kind: 'set-value',
    path: 'layers[0].mapDataId',
    value: 'choropleth',
  });
});

test('a set-value repair calls onRepair with the option as-is', async () => {
  const onRepair = jest.fn();

  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpecWithWarnings}
      onRepair={onRepair}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: "Use 'safe-field'" }));
  });

  expect(onRepair).toHaveBeenCalledWith({
    kind: 'set-value',
    path: 'metadata.metricField',
    value: 'safe-field',
    label: "Use 'safe-field'",
  });
});

test('a set-value repair without a label falls back to the stringified value', async () => {
  const specWithUnlabeledRepair = {
    ...visualizationSpec,
    mockResult: {
      status: 'resolved' as const,
      spec: visualizationSpec,
      warnings: [
        {
          code: 'policy-violation' as const,
          subject: { path: 'metadata.metricField' },
          message: 'Spec violates policy.',
          repair: [
            {
              kind: 'set-value' as const,
              path: 'metadata.metricField',
              value: 'safe-field',
            },
          ],
        },
      ],
    },
  };

  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={specWithUnlabeledRepair}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(
    screen.getByRole('button', { name: 'safe-field' })
  ).toBeInTheDocument();
});

test('repair buttons render disabled rather than hidden when onRepair is omitted', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpecWithWarnings}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(
    screen.getByRole('button', { name: "Use 'safe-field'" })
  ).toBeDisabled();
});

test('cold start: a failing result before any resolve shows the empty state instead of the canvas', () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Map could not be shown')).toBeInTheDocument();
  expect(
    screen.getByText('A layer references a map data id that does not exist.')
  ).toBeInTheDocument();
  expect(screen.queryByTestId('geovis-canvas')).not.toBeInTheDocument();
});

test('cold start: the warnings panel itself suppresses issues even when the sidebar shows for the legend slot', async () => {
  render(
    <GeovisWorkspace
      config={{ ...config, legend: { description: 'Descrição' } }}
      visualizationSpec={failingVisualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('Descrição')).toBeInTheDocument();
  // Shown once, by the map's cold-start empty state — not a second time by
  // the warnings panel, which is also visible now (for the legend slot).
  expect(
    screen.getAllByText('A layer references a map data id that does not exist.')
  ).toHaveLength(1);
});

test('once a resolve succeeds, a later failure keeps the canvas instead of re-showing the cold-start state', () => {
  const { rerender } = render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Map could not be shown')).toBeInTheDocument();

  rerender(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />
  );

  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
  expect(screen.queryByText('Map could not be shown')).not.toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />
  );

  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
  expect(screen.queryByText('Map could not be shown')).not.toBeInTheDocument();
});
