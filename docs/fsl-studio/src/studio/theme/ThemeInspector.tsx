import {
  Button,
  ConfirmationDialog,
  Heading,
  Stack,
  Text,
} from '@ttoss/fsl-ui';
import * as React from 'react';

import { ExportPanel } from './ExportPanel';
import { listTokenPaths } from './overrides';
import { type ContrastResult } from './palette';
import { useThemeStore } from './themeStore';

const looksLikeColor = (value: string): boolean => {
  return /^#[0-9a-fA-F]{3,8}$/.test(value);
};

const ContrastList = ({
  mode,
  results,
}: {
  mode: string;
  results: ContrastResult[];
}) => {
  return (
    <Stack gap="xs">
      <Heading level={3} size="title-sm">
        {mode}
      </Heading>
      <ul className="theme-contrast">
        {results.map((result) => {
          return (
            <li key={result.label} className="theme-contrast-row">
              <span className="theme-contrast-label">{result.label}</span>
              <span
                className={`theme-contrast-badge theme-contrast-${result.rating}`}
              >
                {result.rating === 'fail' ? 'Fail' : result.rating}{' '}
                {result.ratio.toFixed(1)}:1
              </span>
            </li>
          );
        })}
      </ul>
    </Stack>
  );
};

/**
 * Theme lens inspector (PRD F2.3/F2.5/F2.6/F2.7): apply-to-Studio control,
 * the change diff with per-leaf revert and ambient broken-ref badges, WCAG
 * contrast for both modes, and the export peak. Exporting with broken refs
 * goes through the one sanctioned escalation dialog (PRD §6.4-P2).
 */
export const ThemeInspector = () => {
  const store = useThemeStore();
  const [showExport, setShowExport] = React.useState(false);
  const paths = listTokenPaths(store.overrides);
  const hasBrokenRefs = store.brokenRefs.length > 0;

  return (
    <Stack gap="md">
      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Apply
        </Heading>
        <label className="theme-apply">
          <input
            type="checkbox"
            checked={store.applyToStudio}
            onChange={(event) => {
              return store.setApplyToStudio(event.target.checked);
            }}
          />
          Apply this theme to the Studio itself
        </label>
        {store.applyToStudio ? (
          <Button
            evaluation="muted"
            onPress={() => {
              return store.setApplyToStudio(false);
            }}
          >
            Reset Studio to a safe theme
          </Button>
        ) : null}
      </Stack>

      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Changes {paths.length > 0 ? `(${paths.length})` : ''}
        </Heading>
        {paths.length === 0 ? (
          <Text variant="body-sm" tone="muted">
            No changes yet. Edit a token to build a diff against the preset —
            this list is exactly what gets exported.
          </Text>
        ) : (
          <>
            <ul className="theme-diff">
              {paths.map((path) => {
                const value = store.overrides[path];
                const broken = store.brokenRefs.includes(path);
                return (
                  <li key={path} className="theme-diff-row">
                    {looksLikeColor(value) ? (
                      <span
                        className="theme-diff-swatch"
                        style={{ backgroundColor: value }}
                        aria-hidden
                      />
                    ) : null}
                    <span className="theme-diff-path">
                      {/* ✎ marks a manual edit; the ✦ AI-origin marker
                          activates with the Generate lens (Phase 4). */}
                      {store.origin(path) === 'ai' ? '✦' : '✎'} {path}
                    </span>
                    <span className="theme-diff-value">{value}</span>
                    {broken ? (
                      <span
                        className="token-broken-badge"
                        role="img"
                        aria-label={`Broken reference at ${path}`}
                      >
                        ⚠
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="theme-revert"
                      onClick={() => {
                        return store.revertToken(path);
                      }}
                    >
                      Revert
                    </button>
                  </li>
                );
              })}
            </ul>
            <Button
              evaluation="muted"
              onPress={() => {
                return store.resetAll();
              }}
            >
              Reset all
            </Button>
          </>
        )}
      </Stack>

      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Contrast
        </Heading>
        {/* Every Studio preset carries a dark alternate (asserted in
            presets.test), so both mode lists always render. */}
        <ContrastList mode="Light" results={store.contrast.light} />
        <ContrastList mode="Dark" results={store.contrast.dark} />
      </Stack>

      <Stack gap="sm">
        {showExport ? (
          <Button
            evaluation="muted"
            onPress={() => {
              return setShowExport(false);
            }}
          >
            Hide export
          </Button>
        ) : hasBrokenRefs ? (
          <ConfirmationDialog
            trigger={<Button evaluation="muted">Export theme</Button>}
            title="Broken token references"
            confirmLabel="Export anyway"
            cancelLabel="Go back"
            consequence="committing"
            onConfirm={() => {
              return setShowExport(true);
            }}
          >
            {store.brokenRefs.length === 1
              ? 'One token resolves'
              : `${store.brokenRefs.length} tokens resolve`}{' '}
            to a broken reference — the exported theme will carry unresolved
            values.
          </ConfirmationDialog>
        ) : (
          <Button
            evaluation="muted"
            onPress={() => {
              return setShowExport(true);
            }}
          >
            Export theme
          </Button>
        )}
        {showExport ? <ExportPanel /> : null}
      </Stack>
    </Stack>
  );
};
