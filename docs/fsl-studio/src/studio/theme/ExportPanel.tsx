import { getThemeStylesContent } from '@ttoss/fsl-theme/css';
import { toDTCG } from '@ttoss/fsl-theme/dtcg';
import * as React from 'react';

import { generateThemeCode } from './overrides';
import { useThemeStore } from './themeStore';

type Format = 'code' | 'dtcg' | 'css';

const FORMATS: { id: Format; label: string }[] = [
  { id: 'code', label: 'TypeScript' },
  { id: 'dtcg', label: 'DTCG' },
  { id: 'css', label: 'CSS' },
];

/**
 * Export view (PRD F2.7) — the designed peak of the theme flow. Three
 * outputs from the same edited bundle: a runnable `createTheme` snippet, the
 * W3C DTCG token JSON, and the raw CSS custom properties. Rendered inline
 * (never a modal — PRD §6.6).
 */
export const ExportPanel = () => {
  const store = useThemeStore();
  const [format, setFormat] = React.useState<Format>('code');
  // Track the exact content that was last copied. The "Copied" label is then
  // derived (`copiedContent === content`), so switching tabs or editing the
  // theme reverts it to "Copy" without a setState-in-effect.
  const [copiedContent, setCopiedContent] = React.useState<string | null>(null);

  const content = React.useMemo(() => {
    if (format === 'code') {
      return generateThemeCode(store.preset, store.overrides);
    }
    if (format === 'dtcg') {
      return JSON.stringify(toDTCG(store.liveBundle.base), null, 2);
    }
    return getThemeStylesContent(store.liveBundle);
  }, [format, store.preset, store.overrides, store.liveBundle]);

  const copied = copiedContent === content;

  const copy = () => {
    const clipboard = navigator.clipboard;
    if (!clipboard) {
      return;
    }
    const copying = content;
    clipboard.writeText(copying).then(
      () => {
        return setCopiedContent(copying);
      },
      () => {
        return setCopiedContent(null);
      }
    );
  };

  return (
    <section className="theme-export" aria-label="Export">
      <div className="theme-export-tabs" role="tablist" aria-label="Format">
        {FORMATS.map((f) => {
          const selected = format === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className="theme-export-tab"
              onClick={() => {
                return setFormat(f.id);
              }}
            >
              {f.label}
            </button>
          );
        })}
        <button type="button" className="theme-export-copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="theme-export-code" data-testid="export-content">
        <code>{content}</code>
      </pre>
      <p className="theme-hint">
        Use with the fsl skill:{' '}
        <code>npx skills add ttoss/skills --skill fsl</code>
      </p>
    </section>
  );
};
