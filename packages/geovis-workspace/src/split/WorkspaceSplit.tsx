import {
  type GeoVisSplitInput,
  type GeoVisSplitSide,
  useGeoVisMapMode,
  type VisualizationSpec,
} from '@ttoss/geovis';
import * as React from 'react';

import type { GeovisWorkspaceSelection } from '../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { pickMenus, useCameraMenus, useShareCameraMenus } from './cameraMenus';
import { sameSelection } from './sameSelection';

/** A side as it was when the reader last edited it. */
interface SideSnapshot {
  selection: GeovisWorkspaceSelection;
  spec: VisualizationSpec;
}

/**
 * A switch of the side being edited, until the app answers it: the side shows
 * its stored spec while the selection it asked for is still served by the
 * spec the app had built for the other side.
 */
interface Awaiting {
  selection: GeovisWorkspaceSelection;
  /** The app's spec when the switch asked for `selection`. */
  specAtSwitch: VisualizationSpec;
  /** The selection the app held then, for a switch between equal sides. */
  previous: GeovisWorkspaceSelection;
}

export interface WorkspaceSplitValue {
  /** Whether the map is split in two. */
  isSplit: boolean;
  /** The side the sidebar edits. */
  editing: GeoVisSplitSide;
  /** Makes `side` the one the sidebar edits. */
  editSide: (side: GeoVisSplitSide) => void;
  /** Copies the side being edited onto the other side. */
  copyToOther: () => void;
  /** Swaps the two sides. */
  swapSides: () => void;
}

const doNothing = () => {};

const WorkspaceSplitContext = React.createContext<WorkspaceSplitValue>({
  isSplit: false,
  editing: 'a',
  editSide: doNothing,
  copyToOther: doNothing,
  swapSides: doNothing,
});

/** The split map as the sidebar edits it. */
export const useWorkspaceSplit = () => {
  return React.useContext(WorkspaceSplitContext);
};

/** Whether two reports would draw the same split map. */
const sameSplitInput = (a: GeoVisSplitInput, b: GeoVisSplitInput) => {
  return a.sides.a.spec === b.sides.a.spec && a.sides.b.spec === b.sides.b.spec;
};

/**
 * The spec the side being edited shows: the app's, or — while a switch still
 * waits for the app to build its spec — the one stored for that side.
 */
const servedSpec = ({
  awaiting,
  selection,
  appSpec,
  storedSpec,
}: {
  awaiting: Awaiting | null;
  selection: GeovisWorkspaceSelection;
  appSpec: VisualizationSpec;
  storedSpec: VisualizationSpec;
}) => {
  const waiting =
    awaiting !== null &&
    sameSelection(selection, awaiting.selection) &&
    appSpec === awaiting.specAtSwitch &&
    !sameSelection(awaiting.previous, awaiting.selection);
  return waiting ? storedSpec : appSpec;
};

const otherSide = (side: GeoVisSplitSide): GeoVisSplitSide => {
  return side === 'a' ? 'b' : 'a';
};

/**
 * Keeps the two sides of a split map without asking the app for more than it
 * already gives: `variables` and `visualizationSpec` are the side being
 * edited, and the other side is what they were when the reader last edited
 * it. Switching sides hands the stored selection back through the selection
 * change the app already handles, and keeps the side on its stored spec until
 * the app has built the new one.
 *
 * The settings that move the camera — rotation, pitch, 2D/3D — are one for both
 * sides, whose cameras move together: a change on one side reaches the other,
 * and switching or swapping sides keeps them (see `useCameraMenus`).
 *
 * Reports the sides up through `onSplitInput`, for `<GeoVisProvider split>`.
 */
export const WorkspaceSplit = ({
  appSpec,
  onSplitInput,
  children,
}: {
  /** The app's `visualizationSpec`, before the workspace's offsets. */
  appSpec: VisualizationSpec;
  onSplitInput: (input: GeoVisSplitInput) => void;
  children: React.ReactNode;
}) => {
  const { config, selection, replaceSelection } = useGeovisWorkspace();
  const cameraMenus = useCameraMenus({
    sections: config.leftSidebar?.sections ?? [],
    selection,
    appSpec,
  });
  const { mode, activeSide, setActiveSide } = useGeoVisMapMode();
  const isSplit = mode === 'split';

  const [editing, setEditing] = React.useState<GeoVisSplitSide>('a');
  // Both sides, as last edited: the app's map until the reader splits it.
  const [stored, setStored] = React.useState<
    Record<GeoVisSplitSide, SideSnapshot>
  >(() => {
    const snapshot = { selection, spec: appSpec };
    return { a: snapshot, b: snapshot };
  });
  const [awaiting, setAwaiting] = React.useState<Awaiting | null>(null);

  const liveSpec = servedSpec({
    awaiting,
    selection,
    appSpec,
    storedSpec: stored[editing].spec,
  });

  // Entering the split, the other side starts as a copy of this one.
  const wasSplit = React.useRef(false);
  React.useEffect(() => {
    if (isSplit && !wasSplit.current) {
      setEditing('a');
      setAwaiting(null);
      const snapshot = { selection, spec: appSpec };
      setStored({ a: snapshot, b: snapshot });
    }
    if (!isSplit && wasSplit.current) {
      setEditing('a');
      setAwaiting(null);
    }
    wasSplit.current = isSplit;
  }, [isSplit, selection, appSpec]);

  /** Takes `target` as the edited side's selection, and `keep` for `side`. */
  const handOver = React.useCallback(
    ({
      side,
      keep,
      target,
    }: {
      side: GeoVisSplitSide;
      keep: SideSnapshot;
      target: SideSnapshot;
    }) => {
      // The camera stays where it is: both sides share its settings.
      const next = {
        ...target.selection,
        ...pickMenus(selection, cameraMenus),
      };
      setStored((prev) => {
        return {
          ...prev,
          [side]: keep,
          [otherSide(side)]: { ...target, selection: next },
        };
      });
      setAwaiting({
        selection: next,
        specAtSwitch: appSpec,
        previous: selection,
      });
      replaceSelection(next);
    },
    [appSpec, selection, replaceSelection, cameraMenus]
  );

  const switchTo = React.useCallback(
    (next: GeoVisSplitSide) => {
      const current = { selection, spec: liveSpec };
      setEditing(next);
      handOver({
        side: otherSide(next),
        keep: current,
        target: stored[next],
      });
    },
    [selection, liveSpec, stored, handOver]
  );

  // A camera setting changed on the side being edited reaches the other side.
  useShareCameraMenus({
    active: isSplit,
    selection,
    cameraMenus,
    onShare: (values) => {
      const other = otherSide(editing);
      setStored((prev) => {
        const next = { ...prev[other].selection, ...values };
        return { ...prev, [other]: { ...prev[other], selection: next } };
      });
    },
  });

  // A click on the other half of the map makes it the side edited.
  React.useEffect(() => {
    if (isSplit && wasSplit.current && activeSide !== editing) {
      switchTo(activeSide);
    }
  }, [isSplit, activeSide, editing, switchTo]);

  const editSide = React.useCallback(
    (side: GeoVisSplitSide) => {
      if (!isSplit || side === editing) return;
      switchTo(side);
      setActiveSide(side);
    },
    [isSplit, editing, switchTo, setActiveSide]
  );

  const copyToOther = React.useCallback(() => {
    setStored((prev) => {
      return { ...prev, [otherSide(editing)]: { selection, spec: liveSpec } };
    });
  }, [editing, selection, liveSpec]);

  const swapSides = React.useCallback(() => {
    const other = otherSide(editing);
    const current = { selection, spec: liveSpec };
    handOver({
      side: other,
      keep: current,
      target: stored[other],
    });
  }, [editing, selection, liveSpec, stored, handOver]);

  const other = otherSide(editing);
  const sides = {
    [editing]: liveSpec,
    [other]: isSplit ? stored[other].spec : liveSpec,
  } as Record<GeoVisSplitSide, VisualizationSpec>;

  const input: GeoVisSplitInput = {
    sides: { a: { spec: sides.a }, b: { spec: sides.b } },
  };

  // Reported only when it changes, so the workspace re-renders once per change.
  const reported = React.useRef<GeoVisSplitInput | null>(null);
  React.useEffect(() => {
    if (reported.current && sameSplitInput(reported.current, input)) return;
    reported.current = input;
    onSplitInput(input);
  });

  const value = React.useMemo(() => {
    return { isSplit, editing, editSide, copyToOther, swapSides };
  }, [isSplit, editing, editSide, copyToOther, swapSides]);

  return (
    <WorkspaceSplitContext.Provider value={value}>
      {children}
    </WorkspaceSplitContext.Provider>
  );
};
