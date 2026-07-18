import { Button, ConfirmationDialog } from '@ttoss/fsl-ui';
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
    <>
      <h3 className="theme-contrast-mode">{mode}</h3>
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
    </>
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
    <div className="theme-inspector">
      <section className="theme-section">
        <h2 className="theme-section-title">Apply</h2>
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
          <button
            type="button"
            className="theme-fallback"
            onClick={() => {
              return store.setApplyToStudio(false);
            }}
          >
            Reset Studio to a safe theme
          </button>
        ) : null}
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">
          Changes {paths.length > 0 ? `(${paths.length})` : ''}
        </h2>
        {paths.length === 0 ? (
          <p className="theme-hint">
            No changes yet. Edit a token to build a diff against the preset —
            this list is exactly what gets exported.
          </p>
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
            <button
              type="button"
              className="theme-reset-all"
              onClick={() => {
                return store.resetAll();
              }}
            >
              Reset all
            </button>
          </>
        )}
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">Contrast</h2>
        {/* Every Studio preset carries a dark alternate (asserted in
            presets.test), so both mode lists always render. */}
        <ContrastList mode="Light" results={store.contrast.light} />
        <ContrastList mode="Dark" results={store.contrast.dark} />
      </section>

      <section className="theme-section">
        {showExport ? (
          <button
            type="button"
            className="theme-export-toggle"
            aria-expanded
            onClick={() => {
              return setShowExport(false);
            }}
          >
            Hide export
          </button>
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
          <button
            type="button"
            className="theme-export-toggle"
            aria-expanded={false}
            onClick={() => {
              return setShowExport(true);
            }}
          >
            Export theme
          </button>
        )}
        {showExport ? <ExportPanel /> : null}
      </section>
    </div>
  );
};
