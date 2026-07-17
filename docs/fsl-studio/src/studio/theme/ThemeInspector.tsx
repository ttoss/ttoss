import * as React from 'react';

import { ExportPanel } from './ExportPanel';
import { listColorLeaves } from './overrides';
import { useThemeStore } from './themeStore';

/**
 * Theme lens inspector (PRD F2.3/F2.5/F2.6/F2.7): apply-to-Studio control,
 * the change diff with per-leaf revert, ambient contrast checks, and the
 * export peak.
 */
export const ThemeInspector = () => {
  const store = useThemeStore();
  const [showExport, setShowExport] = React.useState(false);
  const leaves = listColorLeaves(store.colors);

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
          Changes {leaves.length > 0 ? `(${leaves.length})` : ''}
        </h2>
        {leaves.length === 0 ? (
          <p className="theme-hint">
            No changes yet. Edit a color to build a diff against the preset —
            this list is exactly what gets exported.
          </p>
        ) : (
          <>
            <ul className="theme-diff">
              {leaves.map(({ hue, step }) => {
                const value = store.colors[hue][step];
                return (
                  <li key={`${hue}.${step}`} className="theme-diff-row">
                    <span
                      className="theme-diff-swatch"
                      style={{ backgroundColor: value }}
                      aria-hidden
                    />
                    <span className="theme-diff-path">
                      {/* Phase 1 edits are all manual (✎). The ✦ AI-origin
                          marker activates with the Generate lens (Phase 4);
                          origin is already tracked in the store. */}
                      ✎ {hue}.{step}
                    </span>
                    <span className="theme-diff-value">{value}</span>
                    <button
                      type="button"
                      className="theme-revert"
                      onClick={() => {
                        return store.revertColor(hue, step);
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
        <ul className="theme-contrast">
          {store.contrast.map((result) => {
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
      </section>

      <section className="theme-section">
        <button
          type="button"
          className="theme-export-toggle"
          aria-expanded={showExport}
          onClick={() => {
            return setShowExport((prev) => {
              return !prev;
            });
          }}
        >
          {showExport ? 'Hide export' : 'Export theme'}
        </button>
        {showExport ? <ExportPanel /> : null}
      </section>
    </div>
  );
};
