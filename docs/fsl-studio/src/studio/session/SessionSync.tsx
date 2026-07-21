import * as React from 'react';

import { useComponentStore } from '../components/componentStore';
import { useThemeStore } from '../theme/themeStore';
import { saveDraft } from './drafts';
import { type SessionSnapshot, snapshotToHash } from './sessionState';
import { useSession } from './sessionStore';

/**
 * URL + drafts synchronizer (PRD F1.2/F1.3, AD-10): projects the session
 * onto the location hash (`history.replaceState` — steering, not history
 * spam) and autosaves the draft, silently and debounced. The write is
 * ambient; the live preview is the confirmation (PRD §6.4-P2).
 */
export const SYNC_DEBOUNCE_MS = 250;

export const SessionSync = () => {
  const session = useSession();
  const theme = useThemeStore();
  const component = useComponentStore();

  const snapshot = React.useMemo<SessionSnapshot>(() => {
    return {
      v: 1,
      lens: session.lens,
      altitude: session.altitude,
      theme: {
        preset: theme.preset,
        overrides: theme.overrides,
        origins: theme.origins,
      },
      component: {
        selection: component.selection,
        evaluation: component.evaluation,
        consequence: component.consequence,
      },
    };
  }, [session, theme, component]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, '', snapshotToHash(snapshot));
      saveDraft(session.draftId, snapshot);
    }, SYNC_DEBOUNCE_MS);
    return () => {
      return window.clearTimeout(timer);
    };
  }, [snapshot, session.draftId]);

  return null;
};
