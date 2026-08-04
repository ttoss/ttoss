/**
 * The surface contract (CONTRACT §3.4, F-024).
 *
 * Two halves, and both need guarding because each fails silently alone: a
 * **publisher** that stops publishing turns every quiet control inside it
 * into a page-coloured pill (the F-024 defect returning), and a **consumer**
 * that stops reading renders correctly on the page and wrong everywhere else
 * — invisible in light mode, where the strata coincide.
 *
 * jsdom resolves no custom properties, so the assertions pin the mechanism
 * (the published property, the `var()` read with its fallback) rather than
 * resolved pixels; the resolved result is verified in a real browser against
 * the Studio's Team table, where the defect was found.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { ActionButton, Box, Button, Surface, ToggleButton } from 'src/index';
import {
  publishSurface,
  quietRestingFill,
  resolveSurfaceBoundStyle,
  SURFACE_VAR,
} from 'src/tokens/surfaceScope';

const MUTED_BG = vars.colors.action.muted!.background!;

describe('surfaceScope — helpers', () => {
  test('publishSurface pairs the fill with its publication', () => {
    expect(publishSurface('#123456')).toEqual({
      backgroundColor: '#123456',
      [SURFACE_VAR]: '#123456',
    });
  });

  test('publishSurface publishes nothing for an absent fill', () => {
    // An undefined colour must not publish an empty surface — a quiet control
    // reading `var(--fsl-surface, X)` with an empty value would paint nothing,
    // which is the omission the owner ruling forbids.
    expect(publishSurface(undefined)).toEqual({});
  });

  test('quietRestingFill wraps the muted rung only', () => {
    expect(quietRestingFill({ evaluation: 'muted', value: '#111111' })).toBe(
      'var(--fsl-surface, #111111)'
    );
    expect(quietRestingFill({ evaluation: 'primary', value: '#111111' })).toBe(
      '#111111'
    );
    expect(
      quietRestingFill({ evaluation: 'muted', value: undefined })
    ).toBeUndefined();
  });

  test('resolveSurfaceBoundStyle binds the resting state alone', () => {
    const states = { default: 'd', hover: 'h', disabled: 'x' };
    const bound = (
      flags: Parameters<typeof resolveSurfaceBoundStyle>[0]['flags']
    ) => {
      return resolveSurfaceBoundStyle({ evaluation: 'muted', states, flags });
    };
    expect(bound({})).toBe('var(--fsl-surface, d)');
    // Engaged and unavailable states are the rung's own fills — they stay
    // absolute so the control still materialises on interaction.
    expect(bound({ isHovered: true })).toBe('h');
    expect(bound({ isDisabled: true })).toBe('x');
  });
});

describe('surfaceScope — quiet consumers read the published surface at rest', () => {
  test('a muted ActionButton rests on the surface and materialises on its own fills', () => {
    render(<ActionButton evaluation="muted">Remove</ActionButton>);
    const el = screen.getByRole('button', { name: 'Remove' });

    expect(el.style.backgroundColor).toBe(
      `var(--fsl-surface, ${MUTED_BG.default})`
    );
    // The edge mirrors the fill — an absolute edge on a borrowed fill would
    // re-draw the seam the contract removes.
    expect(el.style.borderColor).toBe(
      `var(--fsl-surface, ${vars.colors.action.muted!.border!.default})`
    );
  });

  test('a muted Button (command silhouette) gets the same rule', () => {
    render(<Button evaluation="muted">Delete account</Button>);
    expect(
      screen.getByRole('button', { name: 'Delete account' }).style
        .backgroundColor
    ).toBe(`var(--fsl-surface, ${MUTED_BG.default})`);
  });

  test('a muted ToggleButton rests on the surface until engaged', async () => {
    const user = userEvent.setup();
    render(
      <ToggleButton evaluation="muted" aria-label="Pin">
        Pin
      </ToggleButton>
    );
    const el = screen.getByRole('button', { name: 'Pin' });
    expect(el.style.backgroundColor).toBe(
      `var(--fsl-surface, ${MUTED_BG.default})`
    );

    // Engaged (selected) — the persistent toggle fill is the rung's own.
    await user.click(el);
    expect(el.style.backgroundColor).toBe(MUTED_BG.pressed);
  });

  test('a filled rung never follows the surface — the fill is its voice', () => {
    render(<ActionButton evaluation="secondary">Edit</ActionButton>);
    expect(
      screen.getByRole('button', { name: 'Edit' }).style.backgroundColor
    ).toBe(vars.colors.action.secondary!.background!.default);
  });
});

describe('surfaceScope — hosting surfaces publish what they paint', () => {
  test('Surface publishes its stratum, per level', () => {
    render(<Surface level="raised">card</Surface>);
    const el = document.querySelector<HTMLElement>(
      '[data-scope="surface"][data-part="root"]'
    )!;
    expect(el.style.getPropertyValue('--fsl-surface')).toBe(
      el.style.backgroundColor
    );
    expect(el.style.backgroundColor).toBe(vars.elevation.tonal!.raised);
  });

  test('a page-voiced Box publishes; transparent and voiced ones do not', () => {
    const box = () => {
      return document.querySelector<HTMLElement>(
        '[data-scope="box"][data-part="root"]'
      )!;
    };

    const primary = render(<Box background="primary">host</Box>);
    expect(box().style.getPropertyValue('--fsl-surface')).toBe(
      vars.colors.informational.primary.background!.default
    );
    primary.unmount();

    // A voiced fill is not a stratum — the destructive ink fails against the
    // dark muted fill (measured in fsl-theme's inventory), so a voiced Box
    // keeps its voice and quiet controls inside keep their own fills.
    const muted = render(<Box background="muted">host</Box>);
    expect(box().style.getPropertyValue('--fsl-surface')).toBe('');
    muted.unmount();

    render(<Box>plain</Box>);
    expect(box().style.getPropertyValue('--fsl-surface')).toBe('');
  });
});
