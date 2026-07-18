import { Disclosure, DisclosurePanel, DisclosureTrigger } from '@ttoss/fsl-ui';
import * as React from 'react';

import { PRESETS } from './presets';
import { useThemeStore } from './themeStore';
import { type TokenFamily, type TokenLeaf } from './tokenTree';

/** A 6-digit hex is required by `<input type="color">`; fall back safely. */
const forColorInput = (value: string): string => {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
};

/**
 * One editable token leaf. The input holds the raw authored value — a
 * literal or a `{ref}` string (editing a semantic leaf to another ref is the
 * remap surface of PRD F2.2). A broken ref shows an ambient badge on the row,
 * never a modal (PRD §6.4-P2).
 */
const TokenRow = ({ leaf, display }: { leaf: TokenLeaf; display: string }) => {
  const store = useThemeStore();
  const override = store.overrides[leaf.path];
  const isOverridden = override != null;
  const broken = store.brokenRefs.includes(leaf.path);

  return (
    <div className="token-row">
      <label className="token-row-label" htmlFor={`token-${leaf.path}`}>
        {display}
      </label>
      <input
        id={`token-${leaf.path}`}
        type="text"
        className="token-row-input"
        aria-label={leaf.path}
        aria-invalid={broken || undefined}
        value={override ?? leaf.raw}
        onChange={(event) => {
          return store.setToken(leaf.path, event.target.value);
        }}
      />
      {broken ? (
        <span
          className="token-broken-badge"
          role="img"
          aria-label="Broken reference"
        >
          ⚠
        </span>
      ) : null}
      {isOverridden ? (
        <button
          type="button"
          className="theme-revert"
          aria-label={`Revert ${leaf.path}`}
          onClick={() => {
            return store.revertToken(leaf.path);
          }}
        >
          Revert
        </button>
      ) : null}
    </div>
  );
};

/** Leaves are only rendered while their disclosure is open (Miller/chunking). */
const LazyDisclosure = ({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: () => React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Disclosure isExpanded={open} onExpandedChange={setOpen}>
      <DisclosureTrigger>
        {title} · {count}
      </DisclosureTrigger>
      <DisclosurePanel>{open ? children() : null}</DisclosurePanel>
    </Disclosure>
  );
};

/** Display name of a leaf relative to its group prefix. */
const displayName = (leaf: TokenLeaf, segmentsToDrop: number): string => {
  return leaf.path.split('.').slice(segmentsToDrop).join('.');
};

const FamilySection = ({ family }: { family: TokenFamily }) => {
  return (
    <LazyDisclosure title={family.family} count={family.leafCount}>
      {() => {
        return family.groups.map((group) => {
          if (group.label === '') {
            return group.leaves.map((leaf) => {
              return (
                <TokenRow
                  key={leaf.path}
                  leaf={leaf}
                  display={displayName(leaf, 2)}
                />
              );
            });
          }
          return (
            <LazyDisclosure
              key={group.label}
              title={group.label}
              count={group.leaves.length}
            >
              {() => {
                return group.leaves.map((leaf) => {
                  return (
                    <TokenRow
                      key={leaf.path}
                      leaf={leaf}
                      display={displayName(leaf, 3)}
                    />
                  );
                });
              }}
            </LazyDisclosure>
          );
        });
      }}
    </LazyDisclosure>
  );
};

/** The core color scales keep the dedicated picker editor (the SC-1 wow). */
const CoreColorScales = () => {
  const store = useThemeStore();

  return (
    <>
      {store.palette.map((scale) => {
        return (
          <fieldset key={scale.hue} className="theme-scale">
            <legend className="theme-scale-legend">{scale.hue}</legend>
            {scale.steps.map(({ step, base }) => {
              const path = `core.colors.${scale.hue}.${step}`;
              const overridden = store.overrides[path];
              const value = overridden ?? base;
              const isOverridden = overridden != null;
              const inputId = `color-${scale.hue}-${step}`;
              return (
                <div key={step} className="theme-swatch-row">
                  <label className="theme-swatch-label" htmlFor={inputId}>
                    {step}
                  </label>
                  <input
                    id={inputId}
                    type="color"
                    className="theme-swatch-input"
                    aria-label={`${scale.hue} ${step} color`}
                    value={forColorInput(value)}
                    onChange={(event) => {
                      return store.setToken(path, event.target.value);
                    }}
                  />
                  <input
                    type="text"
                    className="theme-swatch-hex"
                    aria-label={`${scale.hue} ${step} hex`}
                    value={value}
                    onChange={(event) => {
                      return store.setToken(path, event.target.value);
                    }}
                  />
                  {isOverridden ? (
                    <button
                      type="button"
                      className="theme-revert"
                      aria-label={`Revert ${scale.hue} ${step}`}
                      onClick={() => {
                        return store.revertToken(path);
                      }}
                    >
                      Revert
                    </button>
                  ) : (
                    <span className="theme-revert-placeholder" aria-hidden />
                  )}
                </div>
              );
            })}
          </fieldset>
        );
      })}
    </>
  );
};

/**
 * Theme lens navigator (PRD F2.1): preset picker, then the semantic layer
 * grouped by family (remap editing per F2.2), then the core layer one level
 * down on demand — color scales with pickers, every other family as raw
 * value rows.
 */
export const ThemeNavigator = () => {
  const store = useThemeStore();

  return (
    <div className="theme-navigator">
      <section className="theme-section">
        <h2 className="theme-section-title">Preset</h2>
        <div className="theme-presets">
          {PRESETS.map((preset) => {
            const active = store.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className="theme-preset"
                aria-pressed={active}
                onClick={() => {
                  return store.setPreset(preset.id);
                }}
                title={preset.description}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">Semantic</h2>
        <p className="theme-hint">
          Meaning-bearing tokens, mostly references. Remap one to another{' '}
          <code>{'{core.…}'}</code> ref and every consumer follows.
        </p>
        {store.semanticTree.map((family) => {
          return <FamilySection key={family.family} family={family} />;
        })}
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">Core</h2>
        {/* Colors open by default: the brand scale is the SC-1 "wow" surface
            and must stay reachable at a glance (recorded in PRD §14). */}
        <LazyDisclosure
          title="colors"
          defaultOpen
          count={store.palette.reduce((total, scale) => {
            return total + scale.steps.length;
          }, 0)}
        >
          {() => {
            return <CoreColorScales />;
          }}
        </LazyDisclosure>
        {store.coreTree.map((family) => {
          return <FamilySection key={family.family} family={family} />;
        })}
      </section>
    </div>
  );
};
