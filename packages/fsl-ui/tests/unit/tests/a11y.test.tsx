/**
 * Accessibility suite (audit A13) — jest-axe over the canonical render of
 * every component in the package.
 *
 * Reuses the auto-discovered DOM fixtures from `domFixtures.tsx` (the same
 * ones the contract suite validates), so a new component gets axe coverage
 * the moment its fixture exists — no registry edits here.
 */
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import { DOM_FIXTURES } from './domFixtures';

// axe drives its checks through real timers/promises.
beforeEach(() => {
  jest.useRealTimers();
});

const fixtureEntries = Object.entries(DOM_FIXTURES);

describe('a11y: axe on every canonical render', () => {
  test.each(fixtureEntries)(
    '%s has no axe violations',
    async (_name, fixture) => {
      const { container } = render(fixture.element());
      fixture.open?.();
      const results = await axe(
        document.body.contains(container) && container.childElementCount > 0
          ? container
          : document.body,
        fixture.axeOptions
      );
      expect(results.violations).toEqual([]);
    },
    15000
  );
});
