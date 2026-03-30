import type { Meta, StoryObj } from '@storybook/react-vite';
import { themes, toFlatTokens } from '@ttoss/theme2';
import type * as React from 'react';

/**
 * Displays semantic spacing, sizing, radii, and elevation tokens.
 *
 * Spacing patterns: inset (control, surface), gap (stack, inline), separation
 * Sizing: hit, icon, touch
 * Radii: control, surface
 * Elevation: flat → top
 */

const TokenBlock = ({
  label,
  value,
  visual,
}: {
  label: string;
  value: string | number;
  visual: React.ReactNode;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '4px 0',
      }}
    >
      {visual}
      <div style={{ fontSize: 13, lineHeight: 1.3 }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ opacity: 0.6, fontFamily: 'monospace', fontSize: 11 }}>
          {String(value)}
        </div>
      </div>
    </div>
  );
};

const SpacingBox = ({ value }: { value: string | number }) => {
  return (
    <div
      style={{
        width: String(value),
        height: 24,
        background: 'var(--tt-action-primary-background-default, #0469E3)',
        borderRadius: 3,
        minWidth: 4,
        opacity: 0.7,
      }}
    />
  );
};

const RadiusBox = ({ value }: { value: string | number }) => {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        border:
          '2px solid var(--tt-action-primary-background-default, #0469E3)',
        borderRadius: String(value),
      }}
    />
  );
};

const ElevationBox = ({ value }: { value: string | number }) => {
  return (
    <div
      style={{
        width: 64,
        height: 48,
        background: 'white',
        boxShadow: String(value),
        borderRadius: 8,
      }}
    />
  );
};

const filterTokens = (
  flat: Record<string, string | number>,
  prefix: string
) => {
  return Object.entries(flat).filter(([key]) => {
    return key.startsWith(prefix) && !key.includes('.$description');
  });
};

const TokenSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <section>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 8,
        }}
      >
        {children}
      </div>
    </section>
  );
};

const TokensShowcase = ({ themeId }: { themeId: string }) => {
  const theme = themes[themeId as keyof typeof themes] ?? themes.default;
  const flat = toFlatTokens(theme);

  const spacing = filterTokens(flat, 'semantic.spacing.');
  const sizing = filterTokens(flat, 'semantic.sizing.');
  const radii = filterTokens(flat, 'semantic.radii.');
  const elevation = filterTokens(flat, 'semantic.elevation.');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <TokenSection title="Spacing">
        {spacing.map(([key, value]) => {
          return (
            <TokenBlock
              key={key}
              label={key.replace('semantic.spacing.', '')}
              value={value}
              visual={<SpacingBox value={value} />}
            />
          );
        })}
      </TokenSection>

      <TokenSection title="Sizing">
        {sizing.map(([key, value]) => {
          return (
            <TokenBlock
              key={key}
              label={key.replace('semantic.sizing.', '')}
              value={value}
              visual={<SpacingBox value={value} />}
            />
          );
        })}
      </TokenSection>

      <TokenSection title="Radii">
        {radii.map(([key, value]) => {
          return (
            <TokenBlock
              key={key}
              label={key.replace('semantic.radii.', '')}
              value={value}
              visual={<RadiusBox value={value} />}
            />
          );
        })}
      </TokenSection>

      <TokenSection title="Elevation">
        {elevation.map(([key, value]) => {
          return (
            <TokenBlock
              key={key}
              label={key.replace('semantic.elevation.', '')}
              value={value}
              visual={<ElevationBox value={value} />}
            />
          );
        })}
      </TokenSection>
    </div>
  );
};

const meta: Meta = {
  title: 'Foundations/Tokens',
  parameters: {
    docs: {
      description: {
        component:
          'Semantic spacing, sizing, radii, and elevation tokens. These define the visual contracts that components consume.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_args, { globals }) => {
    return <TokensShowcase themeId={globals.theme ?? 'default'} />;
  },
};
