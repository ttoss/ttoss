import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@ttoss/theme2/react';

/**
 * ThemeProvider wraps your application and injects `@ttoss/theme2` CSS custom
 * properties into the document. All semantic token vars (`--tt-*`) are
 * available to any descendant via CSS.
 *
 * Use the **Theme** and **Color Mode** toolbar controls above to switch
 * between all available themes and light/dark mode.
 */
const meta: Meta<typeof ThemeProvider> = {
  title: 'theme-v2/Overview/ThemeProvider',
  component: ThemeProvider,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

const TokenRow = ({ label, cssVar }: { label: string; cssVar: string }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: `var(${cssVar})`,
          flexShrink: 0,
          border: '1px solid rgba(128,128,128,0.25)',
          outline: '1px solid rgba(128,128,128,0.2)',
        }}
      />
      <div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--tt-colors-content-muted-text-default)',
          }}
        >
          {cssVar}
        </div>
        <div style={{ fontSize: 14 }}>{label}</div>
      </div>
    </div>
  );
};

/**
 * Tokens from the active theme and mode — switch the toolbar controls to see
 * them update in real time.
 */
export const ActiveTokens: Story = {
  render: () => {
    return (
      <div style={{ fontFamily: 'system-ui', maxWidth: 480 }}>
        <h3 style={{ marginTop: 0 }}>Action colors</h3>
        <TokenRow
          label="Action / Primary / Background / Default"
          cssVar="--tt-colors-action-primary-background-default"
        />
        <TokenRow
          label="Action / Secondary / Background / Default"
          cssVar="--tt-colors-action-secondary-background-default"
        />
        <TokenRow
          label="Action / Negative / Background / Default"
          cssVar="--tt-colors-action-negative-background-default"
        />
        <h3>Navigation colors</h3>
        <TokenRow
          label="Navigation / Primary / Text / Default"
          cssVar="--tt-colors-navigation-primary-text-default"
        />
        <h3>Content colors</h3>
        <TokenRow
          label="Content / Primary / Background / Default"
          cssVar="--tt-colors-content-primary-background-default"
        />
        <TokenRow
          label="Content / Primary / Text / Default"
          cssVar="--tt-colors-content-primary-text-default"
        />
        <TokenRow
          label="Content / Muted / Text / Default"
          cssVar="--tt-colors-content-muted-text-default"
        />
      </div>
    );
  },
};
