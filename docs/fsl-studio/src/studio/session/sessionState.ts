import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import { CATALOG, findEntry } from '../components/catalog';
import { type ComponentSelection } from '../components/componentStore';
import { findPage } from '../components/examplePages';
import { type Lens, LENSES } from '../lenses';
import { type TokenOverrides } from '../theme/overrides';
import { findPreset, type PresetId } from '../theme/presets';
import { type Origin } from '../theme/themeStore';

/**
 * Session state and its URL projection (PRD F1.2, AD-10).
 *
 * The URL hash *is* the session: one `SessionSnapshot` serialized with
 * lz-string. Opening a shared link forks the state (a copy under a new draft
 * id); decoding is defensive because the payload is foreign input — anything
 * that doesn't validate falls back to a safe default, and a payload that
 * doesn't parse at all yields `null` (the app boots home instead of
 * crashing). `applyToStudio` is deliberately local-only: a shared link must
 * not re-skin the receiver's editor chrome (recorded in PRD §14).
 */

export const ALTITUDES = ['component', 'page', 'grid'] as const;

/** Stage altitude (PRD F1.4): isolated component → example page → page grid. */
export type Altitude = (typeof ALTITUDES)[number];

export interface SessionSnapshot {
  v: 1;
  lens: Lens;
  altitude: Altitude;
  theme: {
    preset: PresetId;
    overrides: TokenOverrides;
    origins: Record<string, Origin>;
  };
  component: {
    selection: ComponentSelection;
    evaluation?: string;
    consequence?: string;
  };
}

export const DEFAULT_SELECTION: ComponentSelection = {
  kind: 'component',
  key: CATALOG[0].key,
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const sanitizeOverrides = (value: unknown): TokenOverrides => {
  if (!isRecord(value)) {
    return {};
  }
  const out: TokenOverrides = {};
  for (const key of Object.keys(value)) {
    if (typeof value[key] === 'string') {
      out[key] = value[key];
    }
  }
  return out;
};

const sanitizeOrigins = (
  value: unknown,
  overrides: TokenOverrides
): Record<string, Origin> => {
  if (!isRecord(value)) {
    return {};
  }
  const out: Record<string, Origin> = {};
  for (const key of Object.keys(value)) {
    const origin = value[key];
    if ((origin === 'manual' || origin === 'ai') && key in overrides) {
      out[key] = origin;
    }
  }
  return out;
};

const sanitizeSelection = (value: unknown): ComponentSelection => {
  if (isRecord(value)) {
    if (
      value.kind === 'component' &&
      typeof value.key === 'string' &&
      findEntry(value.key)
    ) {
      return { kind: 'component', key: value.key };
    }
    if (
      value.kind === 'page' &&
      typeof value.id === 'string' &&
      findPage(value.id)
    ) {
      return { kind: 'page', id: value.id };
    }
  }
  return DEFAULT_SELECTION;
};

const optionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined;
};

/**
 * Validate a parsed (foreign) payload into a safe snapshot, or `null` when
 * it isn't a v1 session at all. Individual invalid fields degrade to
 * defaults rather than rejecting the whole link.
 */
export const sanitizeSnapshot = (value: unknown): SessionSnapshot | null => {
  if (!isRecord(value) || value.v !== 1) {
    return null;
  }

  const themeIn = isRecord(value.theme) ? value.theme : {};
  const componentIn = isRecord(value.component) ? value.component : {};
  const overrides = sanitizeOverrides(themeIn.overrides);

  return {
    v: 1,
    lens: LENSES.includes(value.lens as Lens) ? (value.lens as Lens) : 'theme',
    altitude: ALTITUDES.includes(value.altitude as Altitude)
      ? (value.altitude as Altitude)
      : 'component',
    theme: {
      preset: findPreset(String(themeIn.preset))
        ? (themeIn.preset as PresetId)
        : 'base',
      overrides,
      origins: sanitizeOrigins(themeIn.origins, overrides),
    },
    component: {
      selection: sanitizeSelection(componentIn.selection),
      evaluation: optionalString(componentIn.evaluation),
      consequence: optionalString(componentIn.consequence),
    },
  };
};

export const encodeSession = (snapshot: SessionSnapshot): string => {
  return compressToEncodedURIComponent(JSON.stringify(snapshot));
};

export const decodeSession = (raw: string): SessionSnapshot | null => {
  const json = decompressFromEncodedURIComponent(raw);
  if (!json) {
    return null;
  }
  try {
    return sanitizeSnapshot(JSON.parse(json));
  } catch {
    return null;
  }
};

/** The `#s=…` hash for a snapshot, and its parser. */
export const snapshotToHash = (snapshot: SessionSnapshot): string => {
  return `#s=${encodeSession(snapshot)}`;
};

export const snapshotFromHash = (hash: string): SessionSnapshot | null => {
  const match = /^#s=(.+)$/.exec(hash);
  return match ? decodeSession(match[1]) : null;
};
