import type { Meta, StoryObj } from '@storybook/react-vite';
import { createTheme } from '@ttoss/theme2';
import { ThemeProvider } from '@ttoss/theme2/react';

// ---------------------------------------------------------------------------
// ThemeProvider story
// ---------------------------------------------------------------------------

const defaultTheme = createTheme();

/**
 * ThemeProvider wraps your application and injects `@ttoss/theme2` CSS custom
 * properties into the document. All semantic token vars (`--tt-*`) are
 * available to any descendant via CSS.
 */
const meta: Meta<typeof ThemeProvider> = {
  title: 'theme-v2/ThemeProvider',
  component: ThemeProvider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

export const Default: Story = {
  render: () => {
    return (
      <ThemeProvider theme={defaultTheme}>
        <div
          style={{ fontFamily: 'var(--tt-text-body-md-family)', padding: 16 }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--tt-colors-content-primary-text-default)',
            }}
          >
            Content rendered inside ThemeProvider — semantic tokens are active.
          </p>
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: 'var(--tt-colors-content-muted-text-default)',
            }}
          >
            --tt-colors-content-muted-text-default
          </p>
        </div>
      </ThemeProvider>
    );
  },
};
