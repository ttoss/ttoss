import type { Meta, StoryObj } from '@storybook/react-vite';
import { themes, toFlatTokens } from '@ttoss/theme2';

/**
 * Displays all semantic color tokens for the active theme.
 *
 * Colors follow the grammar: `{ux}.{role}.{dimension}.{state}`
 *
 * UX contexts: action, input, content, feedback, navigation
 * Roles: primary, secondary, accent, muted, negative, positive
 * Dimensions: background, border, text
 * States: default, hover, active, focused, disabled, etc.
 */

const UX_GROUPS = [
  'action',
  'input',
  'content',
  'feedback',
  'navigation',
] as const;

const Swatch = ({ name, value }: { name: string; value: string | number }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: String(value),
          border: '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      />
      <div style={{ fontSize: 13, lineHeight: 1.3 }}>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ opacity: 0.6, fontFamily: 'monospace', fontSize: 11 }}>
          {String(value)}
        </div>
      </div>
    </div>
  );
};

const SemanticColors = ({ themeId }: { themeId: string }) => {
  const theme = themes[themeId as keyof typeof themes] ?? themes.default;
  const flat = toFlatTokens(theme);

  const semanticColors = Object.entries(flat).filter(([key]) => {
    return key.startsWith('semantic.colors.') && !key.includes('.$description');
  });

  const grouped = new Map<string, [string, string | number][]>();

  for (const [key, value] of semanticColors) {
    const parts = key.replace('semantic.colors.', '').split('.');
    const ux = parts[0];
    if (!grouped.has(ux)) {
      grouped.set(ux, []);
    }
    grouped.get(ux)!.push([key.replace('semantic.colors.', ''), value]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {UX_GROUPS.map((ux) => {
        const entries = grouped.get(ux);
        if (!entries?.length) {
          return null;
        }
        return (
          <section key={ux}>
            <h3 style={{ textTransform: 'capitalize', marginBottom: 12 }}>
              {ux}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 8,
              }}
            >
              {entries.map(([name, value]) => {
                return <Swatch key={name} name={name} value={value} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: {
    docs: {
      description: {
        component:
          'Semantic color tokens organized by UX context (action, input, content, feedback, navigation). Components consume these tokens — never core colors directly.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_args, { globals }) => {
    return <SemanticColors themeId={globals.theme ?? 'default'} />;
  },
};
