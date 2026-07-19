import {
  Box,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
  Heading,
  Stack,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@ttoss/fsl-ui';
import * as React from 'react';

import { PRESETS } from './presets';
import { useThemeStore } from './themeStore';
import { type TokenFamily, type TokenLeaf } from './tokenTree';

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
    <Stack direction="horizontal" gap="sm" align="center">
      <Box grow>
        <Text as="span" variant="label-sm" tone="muted">
          {display}
        </Text>
      </Box>
      <Box grow>
        <input
          type="text"
          className="token-row-input"
          aria-label={leaf.path}
          aria-invalid={broken || undefined}
          value={override ?? leaf.raw}
          onChange={(event) => {
            return store.setToken(leaf.path, event.target.value);
          }}
        />
      </Box>
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
    </Stack>
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
    // muted: these are token-tree section labels, not navigational links —
    // the primary (link-coloured) evaluation reads wrong for a dense tree.
    <Disclosure isExpanded={open} onExpandedChange={setOpen} evaluation="muted">
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

/** Native `<input type="color">` requires `#rrggbb`; coerce anything else. */
const hexForSwatch = (value: string): string => {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
};

/** One core-colour step: a native swatch + hex text field bound to one value. */
const ColorScaleRow = ({ hue, step, base }: ColorScaleRowProps) => {
  const store = useThemeStore();
  const path = `core.colors.${hue}.${step}`;
  const overridden = store.overrides[path];
  const value = overridden ?? base;

  return (
    <Stack direction="horizontal" gap="sm" align="center">
      <Box grow>
        <Text as="span" variant="label-sm" tone="muted">
          {step}
        </Text>
      </Box>
      {/* The swatch is a token-editor concern (app chrome), not a semantic
          fsl-ui control — so it stays native, styled by studio.css. */}
      <input
        type="color"
        className="token-color-swatch"
        aria-label={`${hue} ${step} color`}
        value={hexForSwatch(value)}
        onChange={(event) => {
          return store.setToken(path, event.target.value);
        }}
      />
      <Box grow>
        <input
          type="text"
          className="token-row-input"
          aria-label={`${hue} ${step} hex`}
          value={value}
          onChange={(event) => {
            return store.setToken(path, event.target.value);
          }}
        />
      </Box>
      {overridden != null ? (
        <button
          type="button"
          className="theme-revert"
          aria-label={`Revert ${hue} ${step}`}
          onClick={() => {
            return store.revertToken(path);
          }}
        >
          Revert
        </button>
      ) : null}
    </Stack>
  );
};

interface ColorScaleRowProps {
  hue: string;
  step: string | number;
  base: string;
}

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
              return (
                <ColorScaleRow
                  key={step}
                  hue={scale.hue}
                  step={step}
                  base={base}
                />
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
    <Stack gap="md">
      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Preset
        </Heading>
        <ToggleButtonGroup
          aria-label="Preset"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[store.preset]}
          onSelectionChange={(keys) => {
            store.setPreset([...keys][0] as (typeof PRESETS)[number]['id']);
          }}
        >
          {PRESETS.map((preset) => {
            return (
              <ToggleButton key={preset.id} id={preset.id} evaluation="muted">
                {preset.label}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </Stack>

      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Semantic
        </Heading>
        <Text variant="body-sm" tone="muted">
          Meaning-bearing tokens, mostly references. Remap one to another{' '}
          <code>{'{core.…}'}</code> ref and every consumer follows.
        </Text>
        {store.semanticTree.map((family) => {
          return <FamilySection key={family.family} family={family} />;
        })}
      </Stack>

      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Core
        </Heading>
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
      </Stack>
    </Stack>
  );
};
