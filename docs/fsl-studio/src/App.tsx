import { getThemeStylesContent } from '@ttoss/fsl-theme/css';
import { ThemeProvider, ThemeReset } from '@ttoss/fsl-theme/react';
import * as React from 'react';

import { ComponentStoreProvider } from './studio/components/componentStore';
import { Home } from './studio/Home';
import { deleteDraft, loadDraft, newDraftId } from './studio/session/drafts';
import {
  bootFromHash,
  type SessionBoot,
  SessionProvider,
} from './studio/session/sessionStore';
import { SessionSync } from './studio/session/SessionSync';
import { StudioShell } from './studio/StudioShell';
import { presetBundle } from './studio/theme/presets';
import { ThemeStoreProvider, useThemeStore } from './studio/theme/themeStore';

/**
 * Chrome + shell. The chrome is themed by the live bundle when "apply to
 * Studio" is on, and by the unedited preset (the safe fallback) otherwise —
 * so a broken work-in-progress theme can never lock the user out of the
 * editor (PRD §6.1, F2.5).
 *
 * We inject the chrome's `:root` CSS ourselves (mirroring the stage) rather
 * than via ThemeProvider's `theme` prop: React 19 hoists the provider's
 * href-keyed `<style>` and does not reliably update its text when the bundle
 * changes, so applied edits wouldn't reach the chrome. A plain `<style>` text
 * child updates on every render. ThemeProvider (no `theme`) still owns the
 * color-mode runtime that stamps `data-tt-mode` on `<html>`.
 */
const ChromeThemedShell = () => {
  const { applyToStudio, liveBundle, fallbackBundle } = useThemeStore();
  const chromeTheme = applyToStudio ? liveBundle : fallbackBundle;

  const chromeCss = React.useMemo(() => {
    return getThemeStylesContent(chromeTheme);
  }, [chromeTheme]);

  return (
    <ThemeProvider defaultMode="system">
      <ThemeReset />
      <style>{chromeCss}</style>
      <StudioShell />
    </ThemeProvider>
  );
};

/**
 * One studio session: the domain stores seeded from the boot snapshot (URL
 * fork or draft), the session layer above them, and the URL/draft sync.
 * Keyed by draft id at the call site, so opening another draft remounts
 * with fresh state.
 */
const StudioSession = ({
  boot,
  onGoHome,
}: {
  boot: SessionBoot;
  onGoHome: () => void;
}) => {
  return (
    <ThemeStoreProvider initial={boot.snapshot?.theme}>
      <ComponentStoreProvider initial={boot.snapshot?.component}>
        <SessionProvider
          draftId={boot.draftId}
          initialLens={boot.lens}
          initialAltitude={boot.snapshot?.altitude}
          onGoHome={onGoHome}
        >
          <SessionSync />
          <ChromeThemedShell />
        </SessionProvider>
      </ComponentStoreProvider>
    </ThemeStoreProvider>
  );
};

/** The home screen wears the base theme (it has no session of its own). */
const homeCss = getThemeStylesContent(presetBundle('base'));

/**
 * FSL Studio root (PRD §6.2, AD-10). Boot resolves from the URL hash: a
 * valid `#s=` payload opens the studio as a fork of that state; otherwise
 * the task-first home. Home actions start a fresh session on the chosen
 * lens or continue an autosaved draft.
 */
export const App = () => {
  const [boot, setBoot] = React.useState<SessionBoot>(() => {
    return bootFromHash(window.location.hash);
  });

  const goHome = React.useCallback(() => {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );
    setBoot({
      screen: 'home',
      snapshot: null,
      lens: 'theme',
      draftId: newDraftId(),
    });
  }, []);

  if (boot.screen === 'home') {
    return (
      <ThemeProvider defaultMode="system">
        <ThemeReset />
        <style>{homeCss}</style>
        <Home
          onStartTask={(lens) => {
            setBoot({
              screen: 'studio',
              snapshot: null,
              lens,
              draftId: newDraftId(),
            });
          }}
          onOpenDraft={(id) => {
            const snapshot = loadDraft(id);
            if (snapshot) {
              setBoot({
                screen: 'studio',
                snapshot,
                lens: snapshot.lens,
                draftId: id,
              });
            }
          }}
          onDeleteDraft={(id) => {
            deleteDraft(id);
            // Re-boot home so the drafts list re-reads storage.
            setBoot({
              screen: 'home',
              snapshot: null,
              lens: 'theme',
              draftId: newDraftId(),
            });
          }}
        />
      </ThemeProvider>
    );
  }

  return <StudioSession key={boot.draftId} boot={boot} onGoHome={goHome} />;
};
