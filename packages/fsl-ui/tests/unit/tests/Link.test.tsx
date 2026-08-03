/**
 * Link — Navigation-entity link, and its `current` affordance.
 *
 * The theme has shipped `navigation.{role}.text.current` since the colour
 * model was written, and until now nothing read it: a link to the live route
 * rendered identically to every other link, which is what pushed the Studio
 * into using `Tabs` as navigation (F-002 → F-017 → F-042). These assertions
 * pin both halves of the fix — the announced state and the resolved colour —
 * because either alone leaves the gap open for a different audience.
 */
import { render, screen } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Link } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="link"][data-part="root"]'
  );
};

describe('Link', () => {
  test('is not current by default, and says nothing about it', () => {
    render(<Link href="/team">Team</Link>);
    const el = root()!;
    expect(el).not.toHaveAttribute('aria-current');
    expect(el).not.toHaveAttribute('data-current');
    expect(el.style.color).toBe(vars.colors.navigation.primary.text!.default);
  });

  test('isCurrent announces `page`, not a bare `true`', () => {
    // The link names a destination, so the specific token is what AT should
    // read — and it is what APG's navigation pattern asks for.
    render(
      <Link href="/team" isCurrent>
        Team
      </Link>
    );
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  test('isCurrent resolves the colour the theme already shipped', () => {
    // The finding behind F-002 was never a missing token — it was a token
    // nothing read. This asserts the reader exists.
    render(
      <Link href="/team" isCurrent>
        Team
      </Link>
    );
    expect(root()?.style.color).toBe(
      vars.colors.navigation.primary.text!.current
    );
  });

  test.each(['primary', 'secondary', 'accent', 'muted'] as const)(
    'evaluation=%s reads its own current ink',
    (evaluation) => {
      render(
        <Link href="/team" evaluation={evaluation} isCurrent>
          Team
        </Link>
      );
      expect(root()?.style.color).toBe(
        vars.colors.navigation[evaluation].text!.current
      );
    }
  );

  test('current yields to disabled — unavailability is the more urgent fact', () => {
    // The cascade's placement asserted through the component rather than
    // through the tuple.
    render(
      <Link href="/team" isCurrent isDisabled>
        Team
      </Link>
    );
    expect(root()?.style.color).toBe(
      vars.colors.navigation.primary.text!.disabled
    );
  });

  test('exposes the state to hosts as a data attribute', () => {
    render(
      <Link href="/team" isCurrent>
        Team
      </Link>
    );
    expect(root()).toHaveAttribute('data-current', 'true');
  });
});
