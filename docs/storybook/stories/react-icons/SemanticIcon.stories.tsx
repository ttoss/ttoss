import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { registerIconGlyphResolver, SemanticIcon } from '@ttoss/react-icons';
import { baseIcons, createTheme } from '@ttoss/theme2';
import { ThemeProvider, useIconGlyph } from '@ttoss/theme2/react';
import type * as React from 'react';

registerIconGlyphResolver(useIconGlyph);

const defaultTheme = createTheme();

const INTENTS = {
  action: [
    'add',
    'edit',
    'copy',
    'paste',
    'search',
    'download',
    'upload',
    'share',
    'refresh',
    'close',
    'clear',
    'delete',
  ],
  navigation: ['back', 'forward', 'external'],
  disclosure: ['expand', 'collapse'],
  visibility: ['show', 'hide'],
  selection: ['checked', 'unchecked', 'indeterminate'],
  status: ['success', 'warning', 'error', 'info'],
  object: ['user', 'calendar', 'attachment', 'settings'],
} as const;

export default {
  title: 'react-icons/SemanticIcon',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
\`SemanticIcon\` renderiza um glifo determinado por um **intent canônico** — um nome semântico
estável que não muda entre temas ou bibliotecas de ícones.

## Setup

Chame \`registerIconGlyphResolver\` uma vez no startup do app, antes de qualquer \`SemanticIcon\` renderizar:

\`\`\`ts
import { registerIconGlyphResolver } from '@ttoss/react-icons';
import { useIconGlyph } from '@ttoss/theme2/react';

registerIconGlyphResolver(useIconGlyph);
\`\`\`

## Uso

Envolva o app no \`ThemeProvider\` de \`@ttoss/theme2/react\` e use a prop \`intent\`:

\`\`\`tsx
import { createTheme } from '@ttoss/theme2';
import { ThemeProvider } from '@ttoss/theme2/react';
import { SemanticIcon } from '@ttoss/react-icons';

const myTheme = createTheme();

export const App = () => (
  <ThemeProvider theme={myTheme}>
    <SemanticIcon intent="action.search" />
  </ThemeProvider>
);
\`\`\`

## Gramática dos intents

\`\`\`
{family}.{intent}
\`\`\`

| Family | Intents |
|---|---|
| \`action\` | add, edit, copy, paste, search, download, upload, share, refresh, close, clear, delete |
| \`navigation\` | back, forward, external |
| \`disclosure\` | expand, collapse |
| \`visibility\` | show, hide |
| \`selection\` | checked, unchecked, indeterminate |
| \`status\` | success, warning, error, info |
| \`object\` | user, calendar, attachment, settings |

## Customizando o mapa de ícones

Passe \`icons\` para \`createTheme\` para sobrescrever intents específicos:

\`\`\`ts
import { baseIcons, createTheme } from '@ttoss/theme2';

const myTheme = createTheme({
  icons: {
    ...baseIcons,
    'action.search': 'ph:magnifying-glass-bold',
  },
});
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => {
      return (
        <ThemeProvider theme={defaultTheme}>
          <Story />
        </ThemeProvider>
      );
    },
  ],
} satisfies Meta;

type Story = StoryObj;

export const AllIntents: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Todos os 30 intents canônicos agrupados por família.',
      },
    },
  },
  render: () => {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '24px' }}>
        {Object.entries(INTENTS).map(([family, intents]) => {
          return (
            <section key={family} style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', textTransform: 'capitalize' }}>
                {family}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {intents.map((intent) => {
                  const fullIntent = `${family}.${intent}`;
                  return (
                    <div
                      key={fullIntent}
                      style={{ textAlign: 'center', width: '80px' }}
                    >
                      <div style={{ fontSize: '32px' }}>
                        <SemanticIcon intent={fullIntent} />
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          marginTop: '4px',
                          color: '#666',
                        }}
                      >
                        {intent}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  },
};

export const SingleIntent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Use o painel de controles para testar qualquer intent individualmente.',
      },
    },
  },
  args: {
    intent: 'action.search',
  },
  argTypes: {
    intent: {
      control: { type: 'select' },
      options: Object.entries(INTENTS).flatMap(([family, intents]) => {
        return intents.map((intent) => {
          return `${family}.${intent}`;
        });
      }),
      description: 'Intent canônico no formato `{family}.{intent}`',
    },
  },
  render: ({ intent }) => {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <div style={{ fontSize: '64px' }}>
          <SemanticIcon intent={intent} />
        </div>
        <div
          style={{ marginTop: '8px', color: '#666', fontFamily: 'monospace' }}
        >
          {intent}
        </div>
      </div>
    );
  },
};

export const CustomTheme: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Override de um intent específico via `createTheme({ icons })`. ' +
          'O ícone `action.search` foi substituído por `ph:magnifying-glass-bold` do Phosphor.',
      },
    },
  },
  render: () => {
    const customTheme = createTheme({
      icons: { ...baseIcons, 'action.search': 'ph:magnifying-glass-bold' },
    });

    return (
      <div style={{ display: 'flex', gap: '48px', fontFamily: 'sans-serif' }}>
        <ThemeProvider theme={defaultTheme}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>
              <SemanticIcon intent="action.search" />
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              padrão (Fluent UI)
            </div>
          </div>
        </ThemeProvider>
        <ThemeProvider theme={customTheme}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>
              <SemanticIcon intent="action.search" />
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              customizado (Phosphor)
            </div>
          </div>
        </ThemeProvider>
      </div>
    );
  },
};
