/* eslint-disable @typescript-eslint/no-unused-vars */
import { useStorage } from '@ttoss/react-hooks';
import type { Theme } from '@ttoss/theme';
import { ThemeProvider } from '@ttoss/ui';
import * as React from 'react';

import {
  defaultThemeObject,
  type ThemeObject,
  themesObjects as defaultThemesObjects,
} from './themesObject';

export const ThemesContext = React.createContext({
  updateCurrentTheme: (theme: Theme) => {},
});

const themesObjectsKey = 'themesObjects';

export const ThemesProvider = ({
  children,
  themeName = defaultThemeObject.name,
}: {
  children: React.ReactNode;
  themeName?: string;
}) => {
  const [themesObjects, setThemesObjects] = useStorage<ThemeObject[]>(
    themesObjectsKey,
    defaultThemesObjects,
    {
      storage: window.sessionStorage,
    }
  );

  const updateCurrentTheme = (theme: Theme) => {
    if (!themesObjects) {
      return;
    }

    const currentThemeIndex = themesObjects.findIndex((themeObject) => {
      return themeObject.name === themeName;
    });

    if (currentThemeIndex === -1) {
      return;
    }

    const currentTheme = themesObjects[currentThemeIndex];

    const newThemesObject = [...themesObjects];

    newThemesObject[currentThemeIndex] = {
      ...currentTheme,
      theme,
    };

    setThemesObjects(newThemesObject);
  };

  const themeObject = themesObjects.find((themeObject) => {
    return themeObject.name === themeName;
  });

  if (!themeObject) {
    return null;
  }

  return (
    <ThemesContext.Provider
      value={{
        updateCurrentTheme,
      }}
    >
      <ThemeProvider theme={themeObject.theme} fonts={themeObject.fonts}>
        {children}
      </ThemeProvider>
    </ThemesContext.Provider>
  );
};

export const useThemes = () => {
  return React.useContext(ThemesContext);
};
