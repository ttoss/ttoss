import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code, Swatch } from '../../_lib/SharedComponents';
import {
  byPrefix,
  coreSemanticMap,
  deref,
  isCssColor,
  isRef,
  rawCoreTokens,
  rawSemanticTokens,
  resolvedTokens,
  toCssVarName,
} from '../../_lib/tokenUtils';

// ---------------------------------------------------------------------------
// File-specific components
// ---------------------------------------------------------------------------

// Token preview — renders a swatch for colors, a bar for dimensions, raw value otherwise
const TokenPreview = ({ path, size = 24 }: { path: string; size?: number }) => {
  const cssVar = toCssVarName(path);
  const resolvedVal = resolvedTokens[path];

  if (resolvedVal !== undefined && isCssColor(resolvedVal)) {
    return <Swatch cssVar={cssVar} size={size} />;
  }

  // For dimension/shadow tokens, show the CSS var name as a tooltip on the chip
  return (
    <div
      title={cssVar}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 6px',
        height: size,
        borderRadius: 4,
        background: 'rgba(128,128,128,0.1)',
        fontSize: 9,
        fontFamily: 'monospace',
        color: 'var(--tt-colors-content-muted-text-default)',
      }}
    >
      {cssVar.split('-').pop()}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Token family definitions — drives the section groupings
// ---------------------------------------------------------------------------

interface TokenFamily {
  label: string;
  corePrefix: string;
  semanticPrefix: string;
  description: string;
}

const TOKEN_FAMILIES: TokenFamily[] = [
  {
    label: 'Colors',
    corePrefix: 'core.colors.',
    semanticPrefix: 'semantic.colors.',
    description:
      'Core palette → semantic colour roles. Each semantic role maps to a core colour primitive; switching themes remaps these connections entirely.',
  },
  {
    label: 'Elevation',
    corePrefix: 'core.elevation.',
    semanticPrefix: 'semantic.elevation.',
    description:
      'Core shadow levels → semantic surface names (flat, raised, overlay, blocking).',
  },
  {
    label: 'Spacing',
    corePrefix: 'core.spacing.',
    semanticPrefix: 'semantic.spacing.',
    description:
      'Responsive spacing engine → semantic spacing aliases consumed by components.',
  },
  {
    label: 'Sizing',
    corePrefix: 'core.sizing.',
    semanticPrefix: 'semantic.sizing.',
    description: 'Fluid sizing ramp and hit targets → semantic sizing aliases.',
  },
  {
    label: 'Radii',
    corePrefix: 'core.radii.',
    semanticPrefix: 'semantic.radii.',
    description: 'Core border-radius primitives → semantic shape aliases.',
  },
  {
    label: 'Border',
    corePrefix: 'core.border.',
    semanticPrefix: 'semantic.border.',
    description: 'Core border width/style primitives → semantic border tokens.',
  },
  {
    label: 'Motion',
    corePrefix: 'core.motion.',
    semanticPrefix: 'semantic.motion.',
    description:
      'Core duration and easing primitives → semantic motion tokens.',
  },
  {
    label: 'Typography',
    corePrefix: 'core.font.',
    semanticPrefix: 'semantic.text.',
    description:
      'Core font primitives (family, scale, weight, leading, tracking) → composite semantic text styles.',
  },
  {
    label: 'Opacity',
    corePrefix: 'core.opacity.',
    semanticPrefix: 'semantic.opacity.',
    description: 'Core opacity steps → semantic opacity tokens.',
  },
  {
    label: 'Z-Index',
    corePrefix: 'core.zIndex.',
    semanticPrefix: 'semantic.zIndex.',
    description: 'Core z-index levels → semantic z-index tokens.',
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'theme-v2/Tokens/Graph',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;

// ---------------------------------------------------------------------------
// Story 1: CoreToSemantic — full cross-family graph
// ---------------------------------------------------------------------------

/**
 * **Core → Semantic Token Graph** — the entire two-layer contract, made visible.
 *
 * For every token family the graph shows each core primitive on the LEFT and
 * all semantic tokens that reference it on the RIGHT. This answers the question:
 *
 * > "Which semantic roles does this core primitive serve?"
 *
 * **Why this matters**
 * - Reveals high fan-out primitives (e.g. `neutral.0` feeds many semantic roles).
 * - Exposes the design intent encoded in the token naming.
 * - Makes theme changes auditable: switching the Theme toolbar updates both sides.
 *
 * Semantic chips with a colour swatch update **live** as you switch themes
 * in the toolbar — the CSS custom properties re-resolve to the new theme's
 * core values automatically.
 *
 * Only core tokens with at least one semantic reference are shown.
 * Core-only primitives (palette anchors with no current alias) are omitted.
 */
export const CoreToSemantic: StoryObj = {
  render: () => {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            marginBottom: 24,
            padding: '12px 16px',
            borderRadius: 8,
            background:
              'var(--tt-colors-informational-accent-background-default)',
            fontSize: 12,
          }}
        >
          <div>
            <strong>Left (Core)</strong>
            <br />
            Intent-free primitives. Stable within a theme, differ between
            themes.
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: 20,
              color: 'var(--tt-colors-content-muted-text-default)',
            }}
          >
            →
          </div>
          <div>
            <strong>Right (Semantic)</strong>
            <br />
            Named roles consumed by components. Update live when you switch
            themes.
          </div>
        </div>

        {TOKEN_FAMILIES.map((family) => {
          const coreEntries = byPrefix(rawCoreTokens, family.corePrefix);
          const graphRows = coreEntries
            .map(([corePath]) => {
              return {
                corePath,
                coreCssVar: toCssVarName(corePath),
                coreLabel: corePath.slice(family.corePrefix.length),
                semantics: (coreSemanticMap.get(corePath) ?? []).filter((s) => {
                  return s.semanticPath.startsWith(family.semanticPrefix);
                }),
              };
            })
            .filter((row) => {
              return row.semantics.length > 0;
            });

          if (graphRows.length === 0) return null;

          return (
            <div key={family.label} style={{ marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: '0 0 4px',
                  paddingBottom: 8,
                  borderBottom:
                    '2px solid var(--tt-colors-action-accent-background-default)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {family.label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: 'var(--tt-colors-content-muted-text-default)',
                  }}
                >
                  {graphRows.length} core tokens ·{' '}
                  {graphRows.reduce((n, r) => {
                    return n + r.semantics.length;
                  }, 0)}{' '}
                  semantic refs
                </span>
              </h2>
              <p
                style={{
                  margin: '0 0 16px',
                  color: 'var(--tt-colors-content-muted-text-default)',
                  fontSize: 12,
                }}
              >
                {family.description}
              </p>

              {graphRows.map((row) => {
                return (
                  <div
                    key={row.corePath}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 28px 1fr',
                      gap: 0,
                      alignItems: 'start',
                      padding: '8px 0',
                      borderBottom:
                        '1px solid var(--tt-colors-content-secondary-border-default)',
                    }}
                  >
                    {/* Core token */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        paddingRight: 8,
                      }}
                    >
                      <TokenPreview path={row.corePath} size={28} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={row.corePath}
                        >
                          {row.coreLabel}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color:
                              'var(--tt-colors-content-muted-text-default)',
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={row.coreCssVar}
                        >
                          {row.coreCssVar}
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div
                      style={{
                        textAlign: 'center',
                        color: 'var(--tt-colors-content-muted-text-default)',
                        fontSize: 16,
                        paddingTop: 4,
                      }}
                    >
                      →
                    </div>

                    {/* Semantic tokens */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 5,
                        paddingLeft: 6,
                      }}
                    >
                      {row.semantics.map((sem) => {
                        const shortPath = sem.semanticPath.slice(
                          family.semanticPrefix.length
                        );
                        const resolvedVal = resolvedTokens[sem.semanticPath];
                        const isColor =
                          resolvedVal !== undefined && isCssColor(resolvedVal);
                        return (
                          <div
                            key={sem.semanticPath}
                            title={`${sem.semanticPath}\n${sem.cssVar}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 7px 3px 5px',
                              borderRadius: 5,
                              border:
                                '1px solid var(--tt-colors-content-secondary-border-default)',
                              fontSize: 10,
                              fontFamily: 'monospace',
                              background:
                                'var(--tt-colors-informational-primary-background-default)',
                            }}
                          >
                            {isColor && (
                              <Swatch
                                cssVar={sem.cssVar}
                                size={14}
                                radius={3}
                              />
                            )}
                            {shortPath}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 2: SemanticIndex — reverse index: semantic token → core reference
// ---------------------------------------------------------------------------

/**
 * **Reverse index** — semantic token → core reference mapping.
 *
 * Complements the CoreToSemantic graph by answering the opposite question:
 * > "Given a semantic token, which core primitive does it alias in each family?"
 *
 * Useful for auditing the semantic layer coverage and checking for semantic
 * tokens that hardcode a raw value instead of referencing a core token.
 */
export const SemanticIndex: StoryObj = {
  render: () => {
    const familyOrder = [
      'semantic.colors.',
      'semantic.elevation.',
      'semantic.spacing.',
      'semantic.text.',
      'semantic.motion.',
      'semantic.radii.',
    ];

    const allFamilies = [
      ...new Set([
        ...familyOrder.filter((p) => {
          return Object.keys(rawSemanticTokens).some((k) => {
            return k.startsWith(p);
          });
        }),
        ...Object.entries(rawSemanticTokens)
          .map(([path]) => {
            const parts = path.split('.');
            return `${parts[0]}.${parts[1]}.`;
          })
          .filter((p, i, a) => {
            return a.indexOf(p) === i && !familyOrder.includes(p);
          }),
      ]),
    ];

    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Every semantic token and the core primitive it references. Raw values
          (non-refs) are flagged — they indicate a token that bypasses the
          two-layer architecture and will not respond to theme switching.
        </p>
        {allFamilies.map((prefix) => {
          const entries = byPrefix(rawSemanticTokens, prefix);
          if (entries.length === 0) return null;
          const familyLabel = prefix
            .slice('semantic.'.length)
            .replace(/\.$/, '');

          return (
            <div key={prefix} style={{ marginBottom: 32 }}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  margin: '0 0 12px',
                  paddingBottom: 8,
                  borderBottom:
                    '2px solid var(--tt-colors-content-secondary-border-default)',
                }}
              >
                {familyLabel}
              </h2>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--tt-colors-content-muted-text-default)',
                        borderBottom:
                          '2px solid var(--tt-colors-content-secondary-border-default)',
                        width: 32,
                      }}
                    />
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--tt-colors-content-muted-text-default)',
                        borderBottom:
                          '2px solid var(--tt-colors-content-secondary-border-default)',
                      }}
                    >
                      Semantic token
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--tt-colors-content-muted-text-default)',
                        borderBottom:
                          '2px solid var(--tt-colors-content-secondary-border-default)',
                      }}
                    >
                      Core reference
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--tt-colors-content-muted-text-default)',
                        borderBottom:
                          '2px solid var(--tt-colors-content-secondary-border-default)',
                        width: 60,
                      }}
                    >
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(([path, rawVal]) => {
                    const cssVar = toCssVarName(path);
                    const shortPath = path.slice(prefix.length);
                    const isRefVal = isRef(rawVal);
                    const coreRef = isRefVal ? deref(rawVal) : null;
                    const resolvedVal = resolvedTokens[path];
                    const isColor =
                      resolvedVal !== undefined && isCssColor(resolvedVal);

                    return (
                      <tr key={path}>
                        <td
                          style={{
                            padding: '5px 10px',
                            borderBottom:
                              '1px solid var(--tt-colors-content-secondary-border-default)',
                            verticalAlign: 'middle',
                          }}
                        >
                          {isColor && (
                            <Swatch cssVar={cssVar} size={20} radius={4} />
                          )}
                        </td>
                        <td
                          style={{
                            padding: '5px 10px',
                            borderBottom:
                              '1px solid var(--tt-colors-content-secondary-border-default)',
                            verticalAlign: 'middle',
                          }}
                        >
                          <Code>{shortPath}</Code>
                        </td>
                        <td
                          style={{
                            padding: '5px 10px',
                            borderBottom:
                              '1px solid var(--tt-colors-content-secondary-border-default)',
                            color:
                              'var(--tt-colors-content-muted-text-default)',
                            verticalAlign: 'middle',
                          }}
                        >
                          <Code>{coreRef ?? String(rawVal)}</Code>
                        </td>
                        <td
                          style={{
                            padding: '5px 10px',
                            borderBottom:
                              '1px solid var(--tt-colors-content-secondary-border-default)',
                            verticalAlign: 'middle',
                          }}
                        >
                          {isRefVal ? (
                            <span
                              style={{
                                fontSize: 9,
                                padding: '2px 5px',
                                borderRadius: 3,
                                background:
                                  'var(--tt-colors-informational-positive-background-default)',
                                fontWeight: 600,
                              }}
                            >
                              ref
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 9,
                                padding: '2px 5px',
                                borderRadius: 3,
                                background:
                                  'var(--tt-colors-informational-caution-background-default)',
                                fontWeight: 600,
                              }}
                            >
                              raw
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  },
};
