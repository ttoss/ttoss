import { type ThemeBundle } from '@ttoss/fsl-theme';
import { toFlatTokens } from '@ttoss/fsl-theme/css';
import * as React from 'react';

import {
  buildBundle,
  type ColorOverrides,
  presetBundle,
  type PresetId,
  removeColorLeaf,
  setColorLeaf,
} from './overrides';
import { computeContrast, type ContrastResult } from './palette';

export type Origin = 'manual' | 'ai';

/** A hue's editable scale, read from the active preset's core palette. */
export interface PaletteScale {
  hue: string;
  /** Ordered steps with their preset (unedited) hex value. */
  steps: { step: string; base: string }[];
}

export interface ThemeReducerState {
  preset: PresetId;
  colors: ColorOverrides;
  origins: Record<string, Origin>;
  applyToStudio: boolean;
}

export type ThemeAction =
  | { type: 'setColor'; hue: string; step: string; value: string }
  | { type: 'revertColor'; hue: string; step: string }
  | { type: 'resetAll' }
  | { type: 'setPreset'; preset: PresetId }
  | { type: 'setApplyToStudio'; value: boolean };

export const initialThemeState: ThemeReducerState = {
  preset: 'base',
  colors: {},
  origins: {},
  applyToStudio: false,
};

const pathKey = (hue: string, step: string) => {
  return `${hue}.${step}`;
};

export const themeReducer = (
  state: ThemeReducerState,
  action: ThemeAction
): ThemeReducerState => {
  switch (action.type) {
    case 'setColor': {
      return {
        ...state,
        colors: setColorLeaf(
          state.colors,
          action.hue,
          action.step,
          action.value
        ),
        origins: {
          ...state.origins,
          [pathKey(action.hue, action.step)]: 'manual',
        },
      };
    }
    case 'revertColor': {
      const origins = { ...state.origins };
      delete origins[pathKey(action.hue, action.step)];
      return {
        ...state,
        colors: removeColorLeaf(state.colors, action.hue, action.step),
        origins,
      };
    }
    case 'resetAll': {
      return { ...state, colors: {}, origins: {} };
    }
    case 'setPreset': {
      // Switching preset starts a fresh diff against that preset (PRD §14).
      return { ...state, preset: action.preset, colors: {}, origins: {} };
    }
    case 'setApplyToStudio': {
      return { ...state, applyToStudio: action.value };
    }
    default: {
      return state;
    }
  }
};

export interface ThemeStore {
  preset: PresetId;
  colors: ColorOverrides;
  applyToStudio: boolean;
  /** The edited bundle — drives the stage always, and the chrome when applied. */
  liveBundle: ThemeBundle;
  /** The unedited preset bundle — the one-click fallback chrome theme. */
  fallbackBundle: ThemeBundle;
  /** Editable palette (hues + steps) read from the active preset. */
  palette: PaletteScale[];
  /** Curated contrast results for the live theme (light mode). */
  contrast: ContrastResult[];
  origin: (hue: string, step: string) => Origin | undefined;
  setColor: (hue: string, step: string, value: string) => void;
  revertColor: (hue: string, step: string) => void;
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
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = React.useReducer(themeReducer, initialThemeState);

  const fallbackBundle = React.useMemo(() => {
    return presetBundle(state.preset);
  }, [state.preset]);

  const liveBundle = React.useMemo(() => {
    return buildBundle(state.preset, state.colors);
  }, [state.preset, state.colors]);

  const palette = React.useMemo(() => {
    return buildPalette(fallbackBundle);
  }, [fallbackBundle]);

  const contrast = React.useMemo(() => {
    return computeContrast(toFlatTokens(liveBundle.base));
  }, [liveBundle]);

  const value = React.useMemo<ThemeStore>(() => {
    return {
      preset: state.preset,
      colors: state.colors,
      applyToStudio: state.applyToStudio,
      liveBundle,
      fallbackBundle,
      palette,
      contrast,
      origin: (hue, step) => {
        return state.origins[pathKey(hue, step)];
      },
      setColor: (hue, step, colorValue) => {
        return dispatch({ type: 'setColor', hue, step, value: colorValue });
      },
      revertColor: (hue, step) => {
        return dispatch({ type: 'revertColor', hue, step });
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
  }, [state, liveBundle, fallbackBundle, palette, contrast]);

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
