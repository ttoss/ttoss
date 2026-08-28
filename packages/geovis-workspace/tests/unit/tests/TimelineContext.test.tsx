/**
 * @jest-environment jsdom
 *
 * The timeline context's inert default. `LeftSidebar` reads it unconditionally,
 * so a tree without `Layout` above — a `controls` slot override, or the sidebar
 * rendered on its own — must degrade to "no timeline" rather than crash.
 */

import { I18nProvider } from '@ttoss/react-i18n';
import { render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { TimelineHud } from 'src/components/TimelineHud';
import { useTimelineContext } from 'src/context/TimelineContext';

const Provider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

const Probe = () => {
  const timeline = useTimelineContext();

  return (
    <button
      type="button"
      data-testid="probe"
      data-filter={String(timeline.filter)}
      data-value={timeline.value}
      data-playing={String(timeline.playing)}
      onClick={() => {
        // The no-ops have to be callable: consumers wire them to real controls
        // without knowing whether a provider is above.
        timeline.setValue(2024);
        timeline.togglePlay();
        timeline.setIntervalSeconds(2);
      }}
    />
  );
};

test('reads as "no timeline" outside a provider, with callable no-ops', () => {
  render(<Probe />);

  const probe = screen.getByTestId('probe');
  expect(probe).toHaveAttribute('data-filter', 'undefined');
  expect(probe).toHaveAttribute('data-value', '0');
  expect(probe).toHaveAttribute('data-playing', 'false');

  expect(() => {
    probe.click();
  }).not.toThrow();
});

test('the HUD renders nothing without a timeline to drive', () => {
  const { container } = render(<TimelineHud onDismiss={() => {}} />, {
    wrapper: Provider,
  });

  expect(container).toBeEmptyDOMElement();
});
