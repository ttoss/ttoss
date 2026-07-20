import * as React from 'react';

import { type Lens } from '../lenses';
import { newDraftId } from './drafts';
import {
  type Altitude,
  type SessionSnapshot,
  snapshotFromHash,
} from './sessionState';

/**
 * The session layer above the domain stores (PRD F1.2/F1.4): the active
 * lens, the stage altitude, the draft identity, and the way back home.
 * Lenses and altitude are projections of the one session — they live here so
 * a lens switch never resets the stage frame and the URL/draft sync sees one
 * consistent state.
 */

export type Screen = 'home' | 'studio';

export interface SessionBoot {
  screen: Screen;
  /** Restored state (URL fork or draft); null = fresh defaults. */
  snapshot: SessionSnapshot | null;
  lens: Lens;
  draftId: string;
}

/**
 * Resolve the boot target from the URL hash (PRD AD-10): a valid `#s=` hash
 * opens the studio as a **fork** — same state, new draft id; anything else
 * lands on the task-first home.
 */
export const bootFromHash = (hash: string): SessionBoot => {
  const snapshot = snapshotFromHash(hash);
  if (snapshot) {
    return {
      screen: 'studio',
      snapshot,
      lens: snapshot.lens,
      draftId: newDraftId(),
    };
  }
  return {
    screen: 'home',
    snapshot: null,
    lens: 'theme',
    draftId: newDraftId(),
  };
};

export interface SessionStore {
  lens: Lens;
  altitude: Altitude;
  draftId: string;
  setLens: (lens: Lens) => void;
  setAltitude: (altitude: Altitude) => void;
  goHome: () => void;
}

const SessionCtx = React.createContext<SessionStore | null>(null);

export const SessionProvider = ({
  children,
  draftId,
  initialLens,
  initialAltitude = 'component',
  onGoHome,
}: {
  children: React.ReactNode;
  draftId: string;
  initialLens: Lens;
  initialAltitude?: Altitude;
  onGoHome: () => void;
}) => {
  const [lens, setLens] = React.useState<Lens>(initialLens);
  const [altitude, setAltitude] = React.useState<Altitude>(initialAltitude);

  const value = React.useMemo<SessionStore>(() => {
    return { lens, altitude, draftId, setLens, setAltitude, goHome: onGoHome };
  }, [lens, altitude, draftId, onGoHome]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
};

export const useSession = (): SessionStore => {
  const store = React.useContext(SessionCtx);
  if (!store) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return store;
};
