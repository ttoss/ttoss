import type { VisualizationSpec } from '@ttoss/geovis';
import * as React from 'react';

import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarSection,
} from '../context/GeovisWorkspaceContext';

/**
 * The menus of the sidebar's `bearing` controls, which only ever turn the
 * camera — known before the reader touches them.
 */
export const bearingMenusOf = (
  sections: GeovisWorkspaceSidebarSection[]
): string[] => {
  return sections.flatMap((section) => {
    if (section.body.kind !== 'settings') return [];
    return section.body.blocks.flatMap((block) => {
      return [
        block.control,
        ...(block.subBlocks ?? []).map((sub) => {
          return sub.control;
        }),
      ]
        .filter((control) => {
          return control.kind === 'bearing';
        })
        .map((control) => {
          return control.menuId;
        });
    });
  });
};

/**
 * A spec's layers without their extrusion: two specs that differ only in the
 * camera, the data, the legends or whether their areas stand in 3D read the
 * same.
 */
const flatLayersOf = (spec: VisualizationSpec) => {
  return JSON.stringify(
    spec.layers.map(({ extrusion: _extrusion, ...layer }) => {
      return layer;
    })
  );
};

/** Which layers stand in 3D. */
const extrudedOf = (spec: VisualizationSpec) => {
  return spec.layers
    .filter((layer) => {
      return layer.extrusion !== undefined;
    })
    .map((layer) => {
      return layer.id;
    })
    .join(',');
};

const anglesChanged = (a: VisualizationSpec, b: VisualizationSpec) => {
  return a.view?.pitch !== b.view?.pitch || a.view?.bearing !== b.view?.bearing;
};

/**
 * Whether going from `a` to `b` only moved the camera or lifted the map into
 * 3D (or laid it flat): what a split map's two sides, one camera between
 * them, must agree on.
 */
const movedTheCamera = (a: VisualizationSpec, b: VisualizationSpec) => {
  return (
    (anglesChanged(a, b) || extrudedOf(a) !== extrudedOf(b)) &&
    flatLayersOf(a) === flatLayersOf(b)
  );
};

/** The menus whose values differ between two selections. */
const changedMenus = (
  a: GeovisWorkspaceSelection,
  b: GeovisWorkspaceSelection
) => {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((key) => {
    return a[key] !== b[key];
  });
};

/**
 * The menus that move the camera of a split map, shared by both of its sides
 * since their cameras move together: every `bearing` control, and any menu
 * whose change turned out to tilt or turn the app's spec, or lift it into 3D,
 * and nothing else in its layers — the pitch choice and the 2D/3D one, say,
 * but not the extrusion height, the opacity or the variation.
 *
 * Learnt from the app's own answers, so no setting has to be marked: a change
 * of one menu is matched with the next spec the app builds for it.
 *
 * @returns A set that grows as the reader moves such menus.
 */
export const useCameraMenus = ({
  sections,
  selection,
  appSpec,
}: {
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
  appSpec: VisualizationSpec;
}) => {
  // One set for the component's life, grown in place as menus are learnt.
  const [known] = React.useState(() => {
    return new Set(bearingMenusOf(sections));
  });

  // The last menu changed alone, and the spec it was changed from: the next
  // spec the app builds answers it.
  const pending = React.useRef<{
    menu: string;
    from: VisualizationSpec;
  } | null>(null);
  const previous = React.useRef({ selection, appSpec });

  React.useEffect(() => {
    const before = previous.current;
    previous.current = { selection, appSpec };
    if (before.selection !== selection) {
      const changed = changedMenus(before.selection, selection);
      pending.current =
        changed.length === 1
          ? { menu: changed[0], from: before.appSpec }
          : null;
    }
    const asked = pending.current;
    if (!asked || appSpec === asked.from) return;
    pending.current = null;
    if (movedTheCamera(asked.from, appSpec)) {
      known.add(asked.menu);
    }
  }, [selection, appSpec, known]);

  return known;
};

/** The values `selection` holds for `menus`, to carry onto the other side. */
export const pickMenus = (
  selection: GeovisWorkspaceSelection,
  menus: Set<string>
): GeovisWorkspaceSelection => {
  const picked: GeovisWorkspaceSelection = {};
  for (const menu of menus) {
    if (menu in selection) picked[menu] = selection[menu];
  }
  return picked;
};

/**
 * Hands the camera settings the reader just changed to `onShare`, while
 * `active`, so the other side of the split map takes them too.
 */
export const useShareCameraMenus = ({
  active,
  selection,
  cameraMenus,
  onShare,
}: {
  active: boolean;
  selection: GeovisWorkspaceSelection;
  cameraMenus: Set<string>;
  onShare: (values: GeovisWorkspaceSelection) => void;
}) => {
  const share = React.useRef(onShare);
  React.useEffect(() => {
    share.current = onShare;
  });
  const last = React.useRef(selection);
  React.useEffect(() => {
    const before = last.current;
    last.current = selection;
    if (!active || before === selection) return;
    const moved = [...cameraMenus].filter((menu) => {
      return before[menu] !== selection[menu];
    });
    if (moved.length > 0) share.current(pickMenus(selection, new Set(moved)));
  }, [active, selection, cameraMenus]);
};
