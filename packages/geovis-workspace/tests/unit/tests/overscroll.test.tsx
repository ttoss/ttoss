/**
 * Scroll chaining: every scrollable region in the workspace contains its own
 * scroll, so reaching the end of a list never starts scrolling the page.
 */

import { render } from '@ttoss/test-utils/react';
import { GeovisWorkspace } from 'src';

import {
  config,
  Provider,
  visualizationSpec,
} from './geovisWorkspaceTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./geovisWorkspaceTestUtils').createGeoVisMock();
});

test('scrollable regions contain their own scroll', () => {
  const { container } = render(
    <GeovisWorkspace
      config={{ ...config, rightSidebar: { title: 'Detalhes' } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  const scrollable = Array.from(container.querySelectorAll('*')).filter(
    (element) => {
      return getComputedStyle(element).overflowY === 'auto';
    }
  );

  expect(scrollable.length).toBeGreaterThan(0);
  for (const element of scrollable) {
    expect(element).toHaveStyle({ overscrollBehavior: 'contain' });
  }
});
