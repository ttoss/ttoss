import { CATALOG } from '../components/catalog';
import { type ComponentStore } from '../components/componentStore';
import { EXAMPLE_PAGES } from '../components/examplePages';
import { LENS_LABELS, LENSES } from '../lenses';
import { PRESETS } from '../theme/presets';
import { type ThemeStore } from '../theme/themeStore';
import { ALTITUDES } from './sessionState';
import { type SessionStore } from './sessionStore';

/**
 * The ⌘K command inventory (PRD F1.5, §6.5): lenses, stage altitudes,
 * presets, every catalog component, the example pages, and session actions.
 * Commands are derived from the same sources as the navigators — no second
 * registry to drift.
 */
export interface Command {
  id: string;
  title: string;
  run: () => void;
}

export const buildCommands = ({
  session,
  theme,
  component,
}: {
  session: SessionStore;
  theme: ThemeStore;
  component: ComponentStore;
}): Command[] => {
  return [
    ...LENSES.map((lens) => {
      return {
        id: `lens:${lens}`,
        title: `Lens: ${LENS_LABELS[lens]}`,
        run: () => {
          return session.setLens(lens);
        },
      };
    }),
    ...ALTITUDES.map((altitude) => {
      return {
        id: `altitude:${altitude}`,
        title: `Stage: ${altitude}`,
        run: () => {
          return session.setAltitude(altitude);
        },
      };
    }),
    ...PRESETS.map((preset) => {
      return {
        id: `preset:${preset.id}`,
        title: `Preset: ${preset.label}`,
        run: () => {
          return theme.setPreset(preset.id);
        },
      };
    }),
    {
      id: 'apply-to-studio',
      title: theme.applyToStudio
        ? 'Stop applying the theme to the Studio'
        : 'Apply the theme to the Studio',
      run: () => {
        return theme.setApplyToStudio(!theme.applyToStudio);
      },
    },
    {
      id: 'home',
      title: 'Go home',
      run: () => {
        return session.goHome();
      },
    },
    ...CATALOG.map((entry) => {
      return {
        id: `component:${entry.key}`,
        title: `Component: ${entry.meta.displayName}`,
        run: () => {
          component.selectComponent(entry.key);
          session.setLens('components');
        },
      };
    }),
    ...EXAMPLE_PAGES.map((page) => {
      return {
        id: `page:${page.id}`,
        title: `Page: ${page.label}`,
        run: () => {
          component.selectPage(page.id);
          session.setLens('components');
        },
      };
    }),
  ];
};

export const filterCommands = (
  commands: Command[],
  query: string
): Command[] => {
  const q = query.trim().toLowerCase();
  if (q === '') {
    return commands;
  }
  return commands.filter((command) => {
    return command.title.toLowerCase().includes(q);
  });
};
