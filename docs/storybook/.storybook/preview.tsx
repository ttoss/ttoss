import { ThemeProvider } from '@ttoss/ui';
import { DecoratorFn } from '@storybook/react';
import { themes } from '../themes';
import { BruttalFonts, DefaultFonts } from '@ttoss/theme';
import { I18nProvider } from '@ttoss/react-i18n';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: ['@Docs', 'Theme', 'Design System', 'UI'],
      locales: 'en-US',
    },
  },
  defaultLocale: 'en',
  locales: ['en'],
};

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'Triangulos',
    toolbar: {
      icon: 'circlehollow',
      items: Object.keys(themes),
      showName: true,
    },
  },
};

export const decorators: DecoratorFn[] = [
  (Story, context) => {
    const theme = {
      ...themes[context.globals.theme],
    };

    return (
      <I18nProvider>
        <ThemeProvider
          theme={theme}
          fonts={[
            'https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Overlock:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap',
            ...DefaultFonts,
            ...BruttalFonts,
          ]}
        >
          <Story />
        </ThemeProvider>
      </I18nProvider>
    );
  },
];
