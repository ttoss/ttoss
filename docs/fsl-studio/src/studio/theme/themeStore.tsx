import { type ThemeBundle } from '@ttoss/fsl-theme';
import { toFlatTokens } from '@ttoss/fsl-theme/css';
import * as React from 'react';

import {
  buildBundle,
  removeToken,
  setToken,
  type TokenOverrides,
} from './overrides';
import { computeThemeContrast, type ThemeContrast } from './palette';
import { presetBundle, type PresetId } from './presets';
import {
  coreFamilies,
  findBrokenRefs,
  semanticFamilies,
  type TokenFamily,
} from './tokenTree';

export type Origin = 'manual' | 'ai';

/** A hue's editable scale, read from the active preset's core palette. */
export interface PaletteScale {
  hue: string;
  /** Ordered steps with their preset (unedited) value. */
  steps: { step: string; base: string }[];
}

export interface ThemeReducerState {
  preset: PresetId;
  overrides: TokenOverrides;
  origins: Record<string, Origin>;
  applyToStudio: boolean;
}

export type ThemeAction =
  | { type: 'setToken'; path: string; value: string }
  | { type: 'revertToken'; path: string }
  | { type: 'resetAll' }
  | { type: 'setPreset'; preset: PresetId }
  | { type: 'setApplyToStudio'; value: boolean };

export const initialThemeState: ThemeReducerState = {
  preset: 'base',
  overrides: {},
  origins: {},
  applyToStudio: false,
};

export const themeReducer = (
  state: ThemeReducerState,
  action: ThemeAction
): ThemeReducerState => {
  switch (action.type) {
    case 'setToken': {
      return {
        ...state,
        overrides: setToken(state.overrides, action.path, action.value),
        origins: { ...state.origins, [action.path]: 'manual' },
      };
    }
    case 'revertToken': {
      const origins = { ...state.origins };
      delete origins[action.path];
      return {
        ...state,
        overrides: removeToken(state.overrides, action.path),
        origins,
      };
    }
    case 'resetAll': {
      return { ...state, overrides: {}, origins: {} };
    }
    case 'setPreset': {
      // Switching preset starts a fresh diff against that preset (PRD §14).
      return { ...state, preset: action.preset, overrides: {}, origins: {} };
    }
    case 'setApplyToStudio': {
      return { ...state, applyToStudio: action.value };
    }
    default: {
      return state;
    }
  }
};

export type { ThemeContrast };

export interface ThemeStore {
  preset: PresetId;
  overrides: TokenOverrides;
  applyToStudio: boolean;
  /** The edited bundle — drives the stage always, and the chrome when applied. */
  liveBundle: ThemeBundle;
  /** The unedited preset bundle — the one-click fallback chrome theme. */
  fallbackBundle: ThemeBundle;
  /** Editable palette (hues + steps) read from the active preset. */
  palette: PaletteScale[];
  /** Curated contrast results for the live theme, light and dark. */
  contrast: ThemeContrast;
  /** Flat paths whose resolved value still contains a broken `{ref}`. */
  brokenRefs: string[];
  /** Semantic families (raw leaves) of the active preset, for the navigator. */
  semanticTree: TokenFamily[];
  /** Core families (colors excluded) of the active preset. */
  coreTree: TokenFamily[];
  origin: (path: string) => Origin | undefined;
  setToken: (path: string, value: string) => void;
  revertToken: (path: string) => void;
  resetAll: () => void;
  setPreset: (preset: PresetId) => void;
  setApplyToStudio: (value: boolean) => void;
}

const ThemeStoreCtx = React.createContext<ThemeStore | null>(null);

const buildPalette = (bundle: ThemeBundle): PaletteScale[] => {
  const colors = bundle.base.core.colors as Record<
    string,
    Record<string, string>
  >;
  return Object.keys(colors)
    .sort()
    .map((hue) => {
      const scale = colors[hue];
      const steps = Object.keys(scale)
        .sort((a, b) => {
          return Number(a) - Number(b);
        })
        .map((step) => {
          return { step, base: String(scale[step]) };
        });
      return { hue, steps };
    });
};

export const ThemeStoreProvider = ({
  children,
  initial,
}: {
  children: React.ReactNode;
  /** Boot-time state (URL fork / draft restore, PRD F1.2/F1.3). */
  initial?: Partial<ThemeReducerState>;
}) => {
  const [state, dispatch] = React.useReducer(themeReducer, {
    ...initialThemeState,
    ...initial,
  });

  const fallbackBundle = React.useMemo(() => {
    return presetBundle(state.preset);
  }, [state.preset]);

  const liveBundle = React.useMemo(() => {
    return buildBundle(state.preset, state.overrides);
  }, [state.preset, state.overrides]);

  const palette = React.useMemo(() => {
    return buildPalette(fallbackBundle);
  }, [fallbackBundle]);

  const semanticTree = React.useMemo(() => {
    return semanticFamilies(fallbackBundle);
  }, [fallbackBundle]);

  const coreTree = React.useMemo(() => {
    return coreFamilies(fallbackBundle);
  }, [fallbackBundle]);

  const lightFlat = React.useMemo(() => {
    return toFlatTokens(liveBundle.base);
  }, [liveBundle]);

  const contrast = React.useMemo<ThemeContrast>(() => {
    return computeThemeContrast(liveBundle, lightFlat);
  }, [liveBundle, lightFlat]);

  const brokenRefs = React.useMemo(() => {
    return findBrokenRefs(lightFlat);
  }, [lightFlat]);

  const value = React.useMemo<ThemeStore>(() => {
    return {
      preset: state.preset,
      overrides: state.overrides,
      applyToStudio: state.applyToStudio,
      liveBundle,
      fallbackBundle,
      palette,
      contrast,
      brokenRefs,
      semanticTree,
      coreTree,
      origin: (path) => {
        return state.origins[path];
      },
      setToken: (path, tokenValue) => {
        return dispatch({ type: 'setToken', path, value: tokenValue });
      },
      revertToken: (path) => {
        return dispatch({ type: 'revertToken', path });
      },
      resetAll: () => {
        return dispatch({ type: 'resetAll' });
      },
      setPreset: (preset) => {
        return dispatch({ type: 'setPreset', preset });
      },
      setApplyToStudio: (v) => {
        return dispatch({ type: 'setApplyToStudio', value: v });
      },
    };
  }, [
    state,
    liveBundle,
    fallbackBundle,
    palette,
    contrast,
    brokenRefs,
    semanticTree,
    coreTree,
  ]);

  return (
    <ThemeStoreCtx.Provider value={value}>{children}</ThemeStoreCtx.Provider>
  );
};

export const useThemeStore = (): ThemeStore => {
  const store = React.useContext(ThemeStoreCtx);
  if (!store) {
    throw new Error('useThemeStore must be used within a ThemeStoreProvider');
  }
  return store;
};
