import type { Meta, StoryObj } from '@storybook/react-vite';
import { themes, toFlatTokens } from '@ttoss/theme2';
import type * as React from 'react';

/**
 * Displays semantic typography tokens.
 *
 * Text styles follow the grammar: `semantic.text.{category}.{size}`
 *
 * Categories: display, headline, title, body, label, code
 * Sizes: xs, sm, md, lg, xl, 2xl (varies by category)
 */

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog';

const TEXT_CATEGORIES = [
  'display',
  'headline',
  'title',
  'body',
  'label',
  'code',
] as const;

const TypographySpecimen = ({
  name,
  tokens,
}: {
  name: string;
  tokens: Record<string, string | number>;
}) => {
  const style: React.CSSProperties = {};

  for (const [key, value] of Object.entries(tokens)) {
    if (key.endsWith('.fontFamily') || key.endsWith('.family')) {
      style.fontFamily = String(value);
    }
    if (key.endsWith('.fontSize') || key.endsWith('.size')) {
      style.fontSize = String(value);
    }
    if (key.endsWith('.fontWeight') || key.endsWith('.weight')) {
      style.fontWeight = Number(value);
    }
    if (key.endsWith('.lineHeight') || key.endsWith('.leading')) {
      style.lineHeight = String(value);
    }
    if (key.endsWith('.letterSpacing') || key.endsWith('.tracking')) {
      style.letterSpacing = String(value);
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          opacity: 0.6,
          marginBottom: 4,
        }}
      >
        {name}
      </div>
      <div style={style}>{SAMPLE_TEXT}</div>
    </div>
  );
};

const TypographyShowcase = ({ themeId }: { themeId: string }) => {
  const theme = themes[themeId as keyof typeof themes] ?? themes.default;
  const flat = toFlatTokens(theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {TEXT_CATEGORIES.map((category) => {
        const prefix = `semantic.text.${category}`;

        // Group by size (e.g. body.md, body.lg)
        const sizeKeys = new Set<string>();
        for (const key of Object.keys(flat)) {
          if (key.startsWith(prefix + '.')) {
            const rest = key.replace(prefix + '.', '');
            const size = rest.split('.')[0];
            sizeKeys.add(size);
          }
        }

        if (sizeKeys.size === 0) {
          return null;
        }

        return (
          <section key={category}>
            <h3 style={{ textTransform: 'capitalize', marginBottom: 12 }}>
              {category}
            </h3>
            {[...sizeKeys].sort().map((size) => {
              const tokenPrefix = `${prefix}.${size}`;
              const tokens: Record<string, string | number> = {};
              for (const [key, value] of Object.entries(flat)) {
                if (key.startsWith(tokenPrefix)) {
                  tokens[key] = value;
                }
              }
              return (
                <TypographySpecimen
                  key={size}
                  name={`text.${category}.${size}`}
                  tokens={tokens}
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
};

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'Semantic typography tokens. Categories: display, headline, title, body, label, code. Each resolved from core type ramps via the active theme.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_args, { globals }) => {
    return <TypographyShowcase themeId={globals.theme ?? 'default'} />;
  },
};
