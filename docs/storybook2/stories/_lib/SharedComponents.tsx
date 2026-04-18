/**
 * Shared presentational primitives for storybook2 token browser stories.
 *
 * Every token family story imports these instead of defining its own — this
 * guarantees visual consistency across the entire token browser and keeps
 * each story file focused on data, not styling boilerplate.
 */

// ---------------------------------------------------------------------------
// Code — click-to-copy inline chip
// ---------------------------------------------------------------------------

/**
 * Monospace chip that copies its text content to the clipboard on click.
 * A brief green flash confirms the copy action.
 */
export const Code = ({ children }: { children: React.ReactNode }) => {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const text = e.currentTarget.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      const el = e.currentTarget;
      el.style.background = 'rgba(76,175,80,0.3)';
      setTimeout(() => {
        el.style.background = '';
      }, 500);
    }
  };

  return (
    <code
      onClick={handleClick}
      title="Click to copy"
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        padding: '2px 5px',
        borderRadius: 3,
        background: 'rgba(128,128,128,0.12)',
        color: 'inherit',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {children}
    </code>
  );
};

// ---------------------------------------------------------------------------
// SectionHeading — divider heading within a story
// ---------------------------------------------------------------------------

/**
 * Section heading used to divide token families or groups within a story.
 */
export const SectionHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <h2
      style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: 16,
        fontWeight: 600,
        margin: '32px 0 12px',
        paddingBottom: 8,
        borderBottom:
          '1px solid var(--tt-colors-content-secondary-border-default)',
      }}
    >
      {children}
    </h2>
  );
};

// ---------------------------------------------------------------------------
// Swatch — CSS-var-driven colour chip
// ---------------------------------------------------------------------------

/**
 * Colour swatch rendered via a CSS custom property. Updates live when the
 * theme toolbar changes because it reads `var(--tt-…)` at paint time.
 */
export const Swatch = ({
  cssVar,
  size = 32,
  radius = 6,
}: {
  cssVar: string;
  size?: number;
  radius?: number;
}) => {
  return (
    <div
      title={cssVar}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `var(${cssVar})`,
        border: '1px solid rgba(128,128,128,0.2)',
        flexShrink: 0,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Shared table styles
// ---------------------------------------------------------------------------

export const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
};

export const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--tt-colors-content-muted-text-default)',
  borderBottom: '2px solid var(--tt-colors-content-secondary-border-default)',
};

export const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--tt-colors-content-secondary-border-default)',
  verticalAlign: 'middle',
};
