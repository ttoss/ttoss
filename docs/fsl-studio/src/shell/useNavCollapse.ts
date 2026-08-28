import * as React from 'react';

/**
 * Whether the shell's navigation should collapse into a drawer.
 *
 * **This lives in the app on purpose, and the design docs put it here.**
 * `families/breakpoints.md` states that breakpoints are "adaptation
 * infrastructure, not visual design tokens", that applications "may adjust or
 * replace them based on real layout needs", and — naming this exact case —
 * that "any local aliases (e.g. `navCollapse`, `shellWide`) stay in the
 * application layer". The same page draws the line the shell's API follows:
 * breakpoints define *when* layout changes, not *how* components behave. So
 * `AppShell` owns the two shapes and Meridian owns the threshold (F-041).
 *
 * The value is read off the emitted custom property rather than duplicated
 * here, which is the use that page sanctions: the CSS variables "are for
 * JS/tooling inspection only", because a custom property cannot be used inside
 * a `@media` query. Reading it keeps one source for the scale — retune the
 * theme and this moves with it.
 */
const BREAKPOINT_VAR = '--tt-core-breakpoints-md';

/** Fallback used only before the theme's stylesheet has applied. */
const FALLBACK_QUERY = '(min-width: 48rem)';

const readQuery = (): string => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(BREAKPOINT_VAR)
    .trim();
  return value === '' ? FALLBACK_QUERY : `(min-width: ${value})`;
};

export const useNavCollapse = (): boolean => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia(readQuery());
    const sync = () => {
      // Collapsed *below* the threshold — mobile-first, as the family doc
      // specifies ("base layout applies below `sm`").
      setIsCollapsed(!query.matches);
    };

    sync();
    query.addEventListener('change', sync);

    return () => {
      query.removeEventListener('change', sync);
    };
  }, []);

  return isCollapsed;
};
