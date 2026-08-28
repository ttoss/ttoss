/**
 * `useNavCollapse` — Meridian's own responsive threshold.
 *
 * The assertions worth having are the layering ones. `families/breakpoints.md`
 * puts local aliases like this in the application layer and keeps components
 * off viewport thresholds, so what this must prove is that the app reads the
 * *theme's* scale rather than duplicating it, and that it degrades instead of
 * throwing where `matchMedia` is absent (F-041).
 */
import { act, renderHook } from '@testing-library/react';

import { useNavCollapse } from '../../../src/shell/useNavCollapse';

type Listener = () => void;

/** Install a controllable `matchMedia`, returning a way to flip the match. */
const installMatchMedia = ({ matches }: { matches: boolean }) => {
  const listeners = new Set<Listener>();
  const query = {
    addEventListener: (_: string, listener: Listener) => {
      listeners.add(listener);
    },
    matches,
    removeEventListener: (_: string, listener: Listener) => {
      listeners.delete(listener);
    },
  };
  const matchMedia = jest.fn(() => {
    return query;
  });
  (window as unknown as { matchMedia: unknown }).matchMedia = matchMedia;
  return {
    listeners,
    matchMedia,
    setMatches: (next: boolean) => {
      query.matches = next;
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
};

describe('useNavCollapse', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--tt-core-breakpoints-md');
  });

  test('collapses below the threshold and not above it', () => {
    const { setMatches } = installMatchMedia({ matches: true });
    const { result } = renderHook(() => {
      return useNavCollapse();
    });

    // `matches` is the min-width query, so a match means "wide enough".
    expect(result.current).toBe(false);
    setMatches(false);
    expect(result.current).toBe(true);
  });

  test('reads the threshold off the theme, never a duplicated scale', () => {
    // The whole reason this is allowed to live in the app: it borrows the
    // theme's value instead of restating it, so retuning the scale moves it.
    document.documentElement.style.setProperty(
      '--tt-core-breakpoints-md',
      '55rem'
    );
    const { matchMedia } = installMatchMedia({ matches: true });
    renderHook(() => {
      return useNavCollapse();
    });
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 55rem)');
  });

  test('falls back to the foundation default before the theme applies', () => {
    const { matchMedia } = installMatchMedia({ matches: true });
    renderHook(() => {
      return useNavCollapse();
    });
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 48rem)');
  });

  test('stops listening when the frame unmounts', () => {
    const { listeners } = installMatchMedia({ matches: true });
    const { unmount } = renderHook(() => {
      return useNavCollapse();
    });
    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
  });

  test('degrades to the permanent shell where matchMedia is absent', () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = undefined;
    const { result } = renderHook(() => {
      return useNavCollapse();
    });
    // Never collapse blindly: a permanent sidebar is the shape that works
    // without knowing the viewport.
    expect(result.current).toBe(false);
  });
});
