/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Theme } from '@ttoss/theme';
import { ThemeProvider } from '@ttoss/ui';
import * as React from 'react';

import {
  defaultThemeObject,
  themesObjects as defaultThemesObject,
} from './themesObject';

export const ThemesContext = React.createContext({
  updateCurrentTheme: (theme: Theme) => {},
});

export const ThemesProvider = ({
  children,
  themeName = defaultThemeObject.name,
}: {
  children: React.ReactNode;
  themeName?: string;
}) => {
  const [themesObjects, setThemesObjects] = React.useState(defaultThemesObject);

  const updateCurrentTheme = (theme: Theme) => {
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
    throw new Error(`Theme ${themeName} not found`);
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
