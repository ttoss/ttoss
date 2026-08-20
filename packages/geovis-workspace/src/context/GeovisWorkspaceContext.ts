import type { MapClickInfo, RepairOption } from '@ttoss/geovis';
import * as React from 'react';

export interface GeovisWorkspaceSource {
  /** Source description text. */
  label: string;
  /** Optional URL — when set, the label becomes an external link. */
  href?: string;
}

export interface GeovisWorkspaceSources {
  /** Optional heading rendered above the source list. */
  title?: string;
  /** One entry per data source. */
  items: GeovisWorkspaceSource[];
}

/**
 * The closed, versioned vocabulary of panel regions a workspace composes.
 * Adding a name is additive; renaming one is breaking (ADR-0002).
 */
export type GeovisWorkspaceSlotName =
  'map' | 'legend' | 'warnings' | 'inspector' | 'metadata' | 'controls';

export interface GeovisWorkspaceSlotConfig {
  /**
   * Replaces the slot's default panel. Renders inside the same provider
   * tree, so it gets runtime access through the public contexts exactly
   * like the default it replaces.
   */
  component?: React.ComponentType;
  /** Hides the slot's region entirely instead of rendering its default. */
  hidden?: boolean;
}

export interface GeovisWorkspaceLegendConfig {
  /** Descriptive paragraph rendered above the legend. */
  description?: string;
  /** Data sources, each optionally rendered as an external link. */
  sources?: GeovisWorkspaceSources;
}

export interface GeovisWorkspaceSidebarState {
  /** Whether the sidebar starts open or closed. Defaults to `'closed'`. */
  initialState?: 'open' | 'closed';
}

export interface GeovisWorkspaceLeftSidebarState extends GeovisWorkspaceSidebarState {
  /**
   * The zoned content of the left sidebar (`controls` slot): an icon tab bar
   * with one tab per section, each hosting either a variation list (driving the
   * shared selection) or a stack of filter blocks (timeline, chips, locator).
   */
  sections: GeovisWorkspaceSidebarSection[];
}

/**
 * Loading/error/data snapshot handed to
 * {@link GeovisWorkspaceRightSidebarState.renderDetails}, derived from the
 * `onFeatureSelect` promise for the current map click.
 */
export interface GeovisWorkspaceDetailState {
  /** `true` while `onFeatureSelect` is in flight. */
  loading: boolean;
  /** Error thrown or rejected by `onFeatureSelect`, or `null`. */
  error: unknown;
  /**
   * Value resolved by `onFeatureSelect`; `null` before the first resolve or
   * when it resolves to `null`. Typed `unknown` — narrow it inside
   * `renderDetails`.
   */
  data: unknown;
}

export interface GeovisWorkspaceRightSidebarState extends GeovisWorkspaceSidebarState {
  /** Title displayed at the top of the right sidebar. */
  title?: string;
  /**
   * Gate deciding whether a map click drives the inspector: return `false` to
   * silently ignore the click (the sidebar keeps its current detail and open
   * state). When omitted, every click is accepted. Pairs with
   * `onFeatureSelect`.
   */
  shouldOpen?: (info: MapClickInfo) => boolean;
  /**
   * Fetches the detail data for the clicked feature. Its promise drives the
   * `loading`/`error`/`data` state handed to `renderDetails`. When set, an
   * accepted click also opens the right sidebar.
   */
  onFeatureSelect?: (info: MapClickInfo) => Promise<unknown>;
  /**
   * Renders the `inspector` slot's content from the current fetch state,
   * replacing the built-in inspector panel when set.
   */
  renderDetails?: (state: GeovisWorkspaceDetailState) => React.ReactNode;
}

/**
 * ─────────────────────────────── Left sidebar ───────────────────────────────
 *
 * The config-driven left sidebar: an icon tab bar (one tab per section), each
 * section hosting either a variation list (groups → variations, driving the
 * shared selection) or a stack of filter blocks (timeline, chips, locator).
 * Configure it via {@link GeovisWorkspaceLeftSidebarState.sections}.
 */

/** A single selectable variation inside a variation group. */
export interface GeovisWorkspaceSidebarVariation {
  /** Value reported through `selection[menuId]` when this variation is chosen. */
  value: string;
  /** Text shown for the variation. */
  label: string;
  /** Iconify token rendered before the label, e.g. `"lucide:tractor"`. */
  icon?: string;
}

/**
 * An accordion group of variations: a collapsible row that expands to reveal
 * its variations below. One group is expanded at a time.
 */
export interface GeovisWorkspaceSidebarVariationGroup {
  /** Unique id of the group; tracks which row is expanded. */
  id: string;
  /** Text shown on the group's row. */
  label: string;
  /** Iconify token rendered in the group's leading chip. */
  icon?: string;
  /** Accent color (hex or token) for the group's active/expanded state. */
  color?: string;
  /** Variations revealed while this group is expanded. */
  variations: GeovisWorkspaceSidebarVariation[];
}

/**
 * Body of the "Variações" tab: a flat list of every group's variations. Drives
 * the same shared selection the menus do, keyed by {@link menuId} — switching a
 * variation recolors the map.
 */
export interface GeovisWorkspaceSidebarVariationsBody {
  kind: 'variations';
  /** Keys the shared selection this zone drives (`selection[menuId]`). */
  menuId: string;
  /** The variation groups; flattened into one list in the given order. */
  groups: GeovisWorkspaceSidebarVariationGroup[];
  /**
   * Id of the group expanded on first render. Unused by the flat list; kept for
   * back-compat with the earlier accordion layout.
   */
  defaultGroupId?: string;
  /** Variation selected on first render. */
  defaultValue?: string;
}

/**
 * A timeline filter: a numeric range (years, months, days, or any step) with an
 * optional mini histogram and prev / play-pause / next controls.
 *
 * When {@link menuId} is set, the current value is written to the shared
 * selection (`selection[menuId]`, as a string) so the app can react to it —
 * this is how the time-lapse drives the map. Without it the value stays local
 * to the preview (visual-only).
 */
export interface GeovisWorkspaceSidebarTimelineFilter {
  kind: 'timeline';
  /**
   * Keys the shared selection this timeline drives (`selection[menuId]`, as a
   * stringified number). Omit to keep the value local (visual-only).
   */
  menuId?: string;
  /** Lowest selectable value. */
  min: number;
  /** Highest selectable value. */
  max: number;
  /** Step between values. Defaults to `1`. */
  step?: number;
  /** Value selected on first render. Defaults to `min`. */
  defaultValue?: number;
  /** Per-key counts for the mini histogram; omit to hide the bars. */
  histogram?: Array<{ key: number; count: number }>;
  /** Unit noun shown next to the value, e.g. `"registros"`. */
  unitLabel?: string;
}

/** One selectable chip in a {@link GeovisWorkspaceSidebarChipsFilter}. */
export interface GeovisWorkspaceSidebarChipOption {
  /** Unique id of the chip. */
  id: string;
  /** Text shown on the chip. */
  label: string;
  /** Leading emoji rendered before the label. */
  emoji?: string;
  /** Iconify token rendered before the label (used when no `emoji`). */
  icon?: string;
}

/**
 * A chips filter: a wrapping row of toggle chips with a "clear" action.
 * Visual-only in the preview — the selection is held locally.
 */
export interface GeovisWorkspaceSidebarChipsFilter {
  kind: 'chips';
  /** The selectable chips. */
  options: GeovisWorkspaceSidebarChipOption[];
  /** Whether more than one chip can be active at once. Defaults to `true`. */
  multiple?: boolean;
  /** Ids of the chips active on first render. */
  defaultSelected?: string[];
}

/** One selectable entry in a {@link GeovisWorkspaceSidebarLocatorFilter}. */
export interface GeovisWorkspaceSidebarLocatorOption {
  /** Unique id of the entry. */
  id: string;
  /** Text matched against the search box and shown in the results. */
  label: string;
  /** Secondary line shown under the label in the selected card. */
  sublabel?: string;
}

/**
 * A locator filter: a search box that filters a list and, once an entry is
 * chosen, shows a selected card and a "zoom" action. Visual-only in the
 * preview — no real map navigation happens.
 */
export interface GeovisWorkspaceSidebarLocatorFilter {
  kind: 'locator';
  /** Placeholder shown in the search box. */
  placeholder?: string;
  /** Minimum characters before results are shown. Defaults to `2`. */
  minChars?: number;
  /** The searchable entries. */
  options: GeovisWorkspaceSidebarLocatorOption[];
}

/** A filter control, discriminated by `kind`. */
export type GeovisWorkspaceSidebarFilterControl =
  | GeovisWorkspaceSidebarTimelineFilter
  | GeovisWorkspaceSidebarChipsFilter
  | GeovisWorkspaceSidebarLocatorFilter;

/** A collapsible block wrapping one filter control. */
export interface GeovisWorkspaceSidebarFilterBlock {
  /** Unique id of the block. */
  id: string;
  /** Heading shown on the block's collapsible header. */
  title: string;
  /** Iconify token rendered before the title. */
  icon?: string;
  /** Whether the block starts expanded. Defaults to `true`. */
  defaultOpen?: boolean;
  /** The control rendered inside the block. */
  control: GeovisWorkspaceSidebarFilterControl;
}

/** Zone body: a stack of collapsible filter blocks (the "Filtros" zone). */
export interface GeovisWorkspaceSidebarFiltersBody {
  kind: 'filters';
  /** The filter blocks, top to bottom. */
  blocks: GeovisWorkspaceSidebarFilterBlock[];
}

/** A zone body, discriminated by `kind`. */
export type GeovisWorkspaceSidebarBody =
  GeovisWorkspaceSidebarVariationsBody | GeovisWorkspaceSidebarFiltersBody;

/** A zone's header: a leading icon chip and a title. */
export interface GeovisWorkspaceSidebarHeader {
  /** Title shown in the header. */
  title: string;
  /** Iconify token rendered in the leading chip. */
  icon?: string;
  /** Color of the header icon (hex or token). */
  iconColor?: string;
  /** Background of the header's icon chip (hex or token). */
  iconBackground?: string;
}

/** One zone of the preview sidebar: a header plus a typed body. */
export interface GeovisWorkspaceSidebarSection {
  /** Unique id of the zone. */
  id: string;
  /** The zone's header. */
  header: GeovisWorkspaceSidebarHeader;
  /** The zone's body: a variation accordion or a filter stack. */
  body: GeovisWorkspaceSidebarBody;
}

export interface GeovisWorkspaceConfig {
  /**
   * Visual framing of the workspace container. `'card'` (default) draws a
   * border, rounded corners, and background — the framed look used when the
   * workspace stands alone (e.g. Storybook). `'bare'` drops the border and
   * radius so the workspace fills its container edge-to-edge when embedded in
   * an app that owns the framing.
   */
  appearance?: 'card' | 'bare';
  /** Per-slot overrides or hides. Omit an entry to use the slot's default. */
  slots?: Partial<Record<GeovisWorkspaceSlotName, GeovisWorkspaceSlotConfig>>;
  /** Content for the `legend` slot's default panel. */
  legend?: GeovisWorkspaceLegendConfig;
  /** Left sidebar (`controls` slot): its `sections` and open/closed state. */
  leftSidebar?: GeovisWorkspaceLeftSidebarState;
  /** Right sidebar (hosts legend/warnings/inspector/metadata) title, open/closed state, and detail API. */
  rightSidebar?: GeovisWorkspaceRightSidebarState;
}

/** Active item value per menu group, keyed by menu id. */
export type GeovisWorkspaceSelection = Record<string, string | undefined>;

export interface GeovisWorkspaceContextValue {
  /** The config that drives the sidebars. */
  config: GeovisWorkspaceConfig;
  /** Active item value per menu group, keyed by menu id. */
  selection: GeovisWorkspaceSelection;
  /** Sets the active item for a given menu group. */
  setSelection: ({ menuId, value }: { menuId: string; value: string }) => void;
  /** Whether the left sidebar is currently open. */
  isLeftSidebarOpen: boolean;
  /** Opens or closes the left sidebar. */
  setLeftSidebarOpen: ({ open }: { open: boolean }) => void;
  /** Whether the right sidebar is currently open. */
  isRightSidebarOpen: boolean;
  /** Opens or closes the right sidebar. */
  setRightSidebarOpen: ({ open }: { open: boolean }) => void;
  /** Called with the chosen `RepairOption` when a repair button is pressed. */
  onRepair?: (repair: RepairOption) => void;
  /**
   * Whether `useGeoVis().result` has ever been `'resolved'` since this
   * workspace mounted. Shared through context (rather than each consumer
   * tracking it independently) so slots that mount only once there is
   * content — like the `warnings` panel — see the same history as slots
   * that are always mounted, such as `map`.
   */
  hasResolvedOnce: boolean;
}

export const GeovisWorkspaceContext = React.createContext<
  GeovisWorkspaceContextValue | undefined
>(undefined);
